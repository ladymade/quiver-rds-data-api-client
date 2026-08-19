import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ConnectionProfileDto } from "../shared/types/ipc";
import { AppSidebar } from "./components/AppSidebar";
import { AppTopbar } from "./components/AppTopbar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ErrorDialogProvider } from "./components/ErrorDialogProvider";
import { InfoPage } from "./components/InfoPage";
import { LoadingOverlayProvider } from "./components/LoadingOverlayProvider";
import { NewProfileForm, type NewProfileFormValues } from "./components/NewProfileForm";
import { QueryEditorPage } from "./components/QueryEditorPage";
import { SettingsPage } from "./components/SettingsPage";
import { useErrorDialog } from "./hooks/useErrorDialog";
import { useLoadingOverlay } from "./hooks/useLoadingOverlay";
import { useUnexpectedErrorHandler } from "./hooks/useUnexpectedErrorHandler";

type AppView = "newProfile" | "queryEditor" | "editProfile" | "info" | "settings";

function AppContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { showErrorDialog } = useErrorDialog();
  const { beginLoading } = useLoadingOverlay();
  const { showUnexpectedError } = useUnexpectedErrorHandler();
  const [currentView, setCurrentView] = useState<AppView>("queryEditor");
  const [formValues, setFormValues] = useState<NewProfileFormValues>({
    profileName: "",
    profileCredentialName: "",
    region: "",
    credentialsDirectory: null,
    clusterArn: "",
    secretArn: "",
    database: "",
    engine: "",
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testConnectionMessage, setTestConnectionMessage] = useState<string | null>(null);
  const [testConnectionSuccess, setTestConnectionSuccess] = useState<boolean | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [createProfileMessage, setCreateProfileMessage] = useState<string | null>(null);
  const [createProfileSuccess, setCreateProfileSuccess] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<ConnectionProfileDto[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState("");
  const [editingProfileName, setEditingProfileName] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.name === selectedProfileName) ?? null,
    [profiles, selectedProfileName]
  );

  const canTestConnection = useMemo(
    () =>
      formValues.profileName.trim().length > 0 &&
      formValues.profileCredentialName.trim().length > 0 &&
      formValues.region.trim().length > 0 &&
      formValues.clusterArn.trim().length > 0 &&
      formValues.secretArn.trim().length > 0 &&
      formValues.database.trim().length > 0,
    [formValues]
  );

  const canCreateProfile = canTestConnection;

  const editingProfile = useMemo(
    () => profiles.find((profile) => profile.name === editingProfileName) ?? null,
    [editingProfileName, profiles]
  );

  const loadProfilesForQueryEditor = async (createdProfileName: string): Promise<boolean> => {
    if (!window.quiverApi) {
      return false;
    }

    const stopLoading = beginLoading(t("profile.loadingProfiles"));

    try {
      const result = await window.quiverApi.listConnectionProfiles();
      const foundProfile = result.profiles.find((profile) => profile.name === createdProfileName);

      if (!foundProfile) {
        showErrorDialog(
          t("profile.failedToOpenEditor"),
          t("profile.createdProfileMissing"),
          t("profile.recreateProfile")
        );
        setCurrentView("newProfile");
        return false;
      }

      setProfiles(result.profiles);
      setSelectedProfileName(foundProfile.name);
      return true;
    } finally {
      stopLoading();
    }
  };

  const handleSelectedProfileNameChange = (profileName: string): void => {
    setSelectedProfileName(profileName);
  };

  const refreshProfiles = async (): Promise<void> => {
    if (!window.quiverApi) {
      return;
    }

    const stopLoading = beginLoading(t("profile.refreshingProfiles"));

    try {
      const result = await window.quiverApi.listConnectionProfiles();
      const hasSelectedProfile = result.profiles.some(
        (profile) => profile.name === selectedProfileName
      );

      setProfiles(result.profiles);

      if (result.profiles.length === 0) {
        setSelectedProfileName("");
        return;
      }

      if (!hasSelectedProfile) {
        setSelectedProfileName(result.profiles[0].name);
      }
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (!window.quiverApi) {
      return;
    }

    const stopLoading = beginLoading(t("profile.loadingProfiles"));

    void window.quiverApi
      .listConnectionProfiles()
      .then((result) => {
        setProfiles(result.profiles);

        if (result.profiles.length === 0) {
          setSelectedProfileName("");
          return;
        }

        setSelectedProfileName((currentSelected) => {
          if (result.profiles.some((profile) => profile.name === currentSelected)) {
            return currentSelected;
          }

          return result.profiles[0].name;
        });
      })
      .catch((error) => {
        showUnexpectedError(error, "renderer:list-connection-profiles");
      })
      .finally(() => {
        stopLoading();
      });
  }, [beginLoading, showUnexpectedError, t]);

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent): void => {
      showUnexpectedError(event.error ?? event.message, "renderer:window-error");
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      showUnexpectedError(event.reason, "renderer:unhandled-rejection");
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [showUnexpectedError]);

  const handleCreateProfile = async (): Promise<void> => {
    if (!window.quiverApi || !canCreateProfile || isCreatingProfile) {
      return;
    }

    setIsCreatingProfile(true);
    setCreateProfileMessage(null);
    setCreateProfileSuccess(null);
    const stopLoading = beginLoading(t("profile.creatingOverlay"));

    try {
      const result = await window.quiverApi.createConnectionProfile({
        name: formValues.profileName,
        credentialProfileName: formValues.profileCredentialName,
        region: formValues.region,
        credentialsDirectory: formValues.credentialsDirectory,
        clusterArn: formValues.clusterArn,
        secretArn: formValues.secretArn,
        database: formValues.database,
        engine: formValues.engine === "" ? undefined : formValues.engine,
      });

      setCreateProfileSuccess(result.success);
      setCreateProfileMessage(
        result.success ? null : (result.errorMessage ?? t("profile.failedToCreate"))
      );

      if (result.success) {
        const loaded = await loadProfilesForQueryEditor(formValues.profileName);
        if (loaded) {
          setCurrentView("queryEditor");
        }
      }
    } catch (error) {
      setCreateProfileSuccess(false);
      setCreateProfileMessage(null);
      showUnexpectedError(error, "renderer:create-profile");
    } finally {
      stopLoading();
      setIsCreatingProfile(false);
    }
  };

  const handleUpdateProfile = async (): Promise<void> => {
    if (!window.quiverApi || !editingProfile || !canCreateProfile || isCreatingProfile) {
      return;
    }

    setIsCreatingProfile(true);
    setCreateProfileMessage(null);
    setCreateProfileSuccess(null);
    const stopLoading = beginLoading(t("profile.savingOverlay"));

    try {
      const result = await window.quiverApi.updateConnectionProfile({
        previousName: editingProfile.name,
        profile: {
          name: formValues.profileName,
          credentialProfileName: formValues.profileCredentialName,
          region: formValues.region,
          credentialsDirectory: formValues.credentialsDirectory,
          clusterArn: formValues.clusterArn,
          secretArn: formValues.secretArn,
          database: formValues.database,
          engine: formValues.engine === "" ? undefined : formValues.engine,
        },
      });

      setCreateProfileSuccess(result.success);
      setCreateProfileMessage(
        result.success ? null : (result.errorMessage ?? t("profile.failedToUpdate"))
      );

      if (result.success) {
        await refreshProfiles();
        setSelectedProfileName(formValues.profileName);
        setEditingProfileName(null);
        setCurrentView("queryEditor");
      }
    } catch (error) {
      setCreateProfileSuccess(false);
      setCreateProfileMessage(null);
      showUnexpectedError(error, "renderer:update-profile");
    } finally {
      stopLoading();
      setIsCreatingProfile(false);
    }
  };

  const handleDeleteProfile = async (): Promise<void> => {
    if (!window.quiverApi || !editingProfile || isCreatingProfile) {
      return;
    }

    setIsCreatingProfile(true);
    setCreateProfileMessage(null);
    setCreateProfileSuccess(null);
    const stopLoading = beginLoading(t("profile.deletingOverlay"));

    try {
      const result = await window.quiverApi.deleteConnectionProfile(editingProfile.name);

      setCreateProfileSuccess(result.success);
      setCreateProfileMessage(
        result.success ? null : (result.errorMessage ?? t("profile.failedToDelete"))
      );

      if (result.success) {
        const listResult = await window.quiverApi.listConnectionProfiles();
        setProfiles(listResult.profiles);
        setSelectedProfileName(listResult.profiles[0]?.name ?? "");
        setEditingProfileName(null);
        setCurrentView("queryEditor");
      }
    } catch (error) {
      setCreateProfileSuccess(false);
      setCreateProfileMessage(null);
      showUnexpectedError(error, "renderer:delete-profile");
    } finally {
      stopLoading();
      setIsCreatingProfile(false);
    }
  };

  const handleTestConnection = async (): Promise<void> => {
    if (!window.quiverApi || !canTestConnection || isTestingConnection) {
      return;
    }

    setIsTestingConnection(true);
    setTestConnectionMessage(null);
    setTestConnectionSuccess(null);
    const stopLoading = beginLoading(t("profile.testingOverlay"));

    try {
      const result = await window.quiverApi.testConnection({
        profileName: formValues.profileCredentialName,
        region: formValues.region,
        credentialsDirectory: formValues.credentialsDirectory ?? undefined,
        resourceArn: formValues.clusterArn,
        secretArn: formValues.secretArn,
        database: formValues.database,
      });

      setTestConnectionSuccess(result.success);

      if (result.success) {
        setTestConnectionMessage(result.message);
      } else {
        setTestConnectionMessage(null);
        showErrorDialog(t("common.executionError"), result.message, result.details);
      }
    } catch (error) {
      setTestConnectionSuccess(false);
      setTestConnectionMessage(null);
      showUnexpectedError(error, "renderer:test-connection");
    } finally {
      stopLoading();
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3fbfc]">
      <AppSidebar
        isInfoActive={currentView === "info"}
        isQueryEditorActive={currentView === "queryEditor" || currentView === "editProfile"}
        isNewProfileActive={currentView === "newProfile"}
        isSettingsActive={currentView === "settings"}
        onInfoClick={() => {
          setCurrentView("info");
        }}
        onQueryEditorClick={() => {
          setCurrentView("queryEditor");
        }}
        onSettingsClick={() => {
          setCurrentView("settings");
        }}
        onNewProfileClick={() => {
          setEditingProfileName(null);
          setFormValues({
            profileName: "",
            profileCredentialName: "",
            region: "",
            credentialsDirectory: null,
            clusterArn: "",
            secretArn: "",
            database: "",
            engine: "",
          });
          setCurrentView("newProfile");
        }}
      />
      <main className="ml-20 min-w-0 flex-1 bg-[#f3fbfc]">
        {currentView === "newProfile" || currentView === "editProfile" ? (
          <AppTopbar
            pageTitle={currentView === "newProfile" ? t("profile.new") : t("profile.edit")}
            showProfileActions={currentView === "newProfile" || currentView === "editProfile"}
            canPrimaryAction={canCreateProfile}
            canTestConnection={canTestConnection}
            primaryActionMessage={createProfileMessage}
            primaryActionSuccess={createProfileSuccess}
            isPrimaryActionLoading={isCreatingProfile}
            primaryActionLabel={
              currentView === "newProfile" ? t("profile.create") : t("profile.save")
            }
            primaryActionLoadingLabel={
              currentView === "newProfile" ? t("profile.creating") : t("profile.saving")
            }
            isTestingConnection={isTestingConnection}
            showDeleteAction={currentView === "editProfile"}
            isDeleteActionLoading={isCreatingProfile}
            onDeleteAction={() => {
              if (currentView !== "editProfile") {
                return;
              }

              setIsDeleteConfirmOpen(true);
            }}
            onPrimaryAction={() => {
              if (currentView === "newProfile") {
                void handleCreateProfile();
                return;
              }

              void handleUpdateProfile();
            }}
            onTestConnection={() => {
              void handleTestConnection();
            }}
            testConnectionMessage={testConnectionMessage}
            testConnectionSuccess={testConnectionSuccess}
          />
        ) : null}
        {currentView === "info" ? (
          <InfoPage />
        ) : currentView === "settings" ? (
          <SettingsPage />
        ) : currentView === "newProfile" ? (
          <section
            className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-8 py-8"
            aria-labelledby="page-title"
          >
            <div className="space-y-1">
              <h2 className="stitch-headline-lg text-slate-900" id="page-title">
                {t("profile.create")}
              </h2>
              <p className="stitch-body-md text-slate-600">{t("profile.createDescription")}</p>
            </div>
            <NewProfileForm onChange={setFormValues} />
          </section>
        ) : currentView === "editProfile" ? (
          <section
            className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-8 py-8"
            aria-labelledby="page-title"
          >
            <div className="space-y-1">
              <h2 className="stitch-headline-lg text-slate-900" id="page-title">
                {t("profile.edit")}
              </h2>
              <p className="stitch-body-md text-slate-600">{t("profile.editDescription")}</p>
            </div>
            <NewProfileForm
              initialValues={
                editingProfile
                  ? {
                      profileName: editingProfile.name,
                      profileCredentialName: editingProfile.credentialProfileName,
                      region: editingProfile.region,
                      credentialsDirectory: editingProfile.credentialsDirectory,
                      clusterArn: editingProfile.clusterArn,
                      secretArn: editingProfile.secretArn,
                      database: editingProfile.database,
                      engine: editingProfile.engine ?? "",
                    }
                  : null
              }
              onChange={setFormValues}
            />
          </section>
        ) : (
          <QueryEditorPage
            onCreateProfile={() => {
              setCurrentView("newProfile");
            }}
            onEditProfile={() => {
              if (selectedProfile == null) {
                return;
              }

              setFormValues({
                profileName: selectedProfile.name,
                profileCredentialName: selectedProfile.credentialProfileName,
                region: selectedProfile.region,
                credentialsDirectory: selectedProfile.credentialsDirectory,
                clusterArn: selectedProfile.clusterArn,
                secretArn: selectedProfile.secretArn,
                database: selectedProfile.database,
                engine: selectedProfile.engine ?? "",
              });
              setEditingProfileName(selectedProfile.name);
              setCurrentView("editProfile");
            }}
            onSelectedProfileNameChange={handleSelectedProfileNameChange}
            profiles={profiles}
            selectedProfile={selectedProfile}
            selectedProfileName={selectedProfileName}
          />
        )}
      </main>
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title={t("profile.delete")}
        message={t("profile.deleteConfirmation")}
        confirmLabel={t("common.delete")}
        isConfirming={isCreatingProfile}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          void handleDeleteProfile();
        }}
      />
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <LoadingOverlayProvider>
      <ErrorDialogProvider>
        <AppContent />
      </ErrorDialogProvider>
    </LoadingOverlayProvider>
  );
}

export default App;
