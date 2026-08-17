import { FolderOpen } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AwsCredentialProfileDto, DbClusterDto } from "../../shared/types/ipc";
import { AWS_REGIONS } from "../constants/awsRegions";
import { useErrorDialog } from "../hooks/useErrorDialog";
import { useLoadingOverlay } from "../hooks/useLoadingOverlay";
import { useUnexpectedErrorHandler } from "../hooks/useUnexpectedErrorHandler";
import { FormField } from "./FormField";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

export type NewProfileFormValues = {
  profileName: string;
  profileCredentialName: string;
  region: string;
  credentialsDirectory: string | null;
  clusterArn: string;
  secretArn: string;
  database: string;
  engine: "postgresql" | "mysql" | "";
};

type ClusterInputMode = "select" | "direct-arn";

type NewProfileFormProps = {
  onChange?: (values: NewProfileFormValues) => void;
  initialValues?: Partial<NewProfileFormValues> | null;
};

export function NewProfileForm({
  onChange,
  initialValues,
}: NewProfileFormProps): React.JSX.Element {
  const [credentialProfiles, setCredentialProfiles] = useState<AwsCredentialProfileDto[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [selectedCredentialName, setSelectedCredentialName] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCredentialsDirectory, setSelectedCredentialsDirectory] = useState<string | null>(
    null
  );
  const [credentialLoadError, setCredentialLoadError] = useState<string | null>(null);
  const [dbClusters, setDbClusters] = useState<DbClusterDto[]>([]);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [clusterInputMode, setClusterInputMode] = useState<ClusterInputMode>("select");
  const [selectedClusterArn, setSelectedClusterArn] = useState("");
  const [selectedClusterEngine, setSelectedClusterEngine] = useState<"postgresql" | "mysql" | "">(
    ""
  );
  const [directClusterArn, setDirectClusterArn] = useState("");
  const [directClusterEngine, setDirectClusterEngine] = useState<"postgresql" | "mysql" | "">("");
  const [secretsManagerArn, setSecretsManagerArn] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const lastAppliedInitialValuesKeyRef = useRef<string | null>(null);
  const pendingInitialClusterArnRef = useRef<string | null>(null);
  const { showErrorDialog } = useErrorDialog();
  const { beginLoading } = useLoadingOverlay();
  const { showUnexpectedError } = useUnexpectedErrorHandler();

  const effectiveClusterArn = clusterInputMode === "select" ? selectedClusterArn : directClusterArn;
  const effectiveClusterEngine =
    clusterInputMode === "select" ? selectedClusterEngine : directClusterEngine;

  const loadCredentialProfiles = useCallback(
    async (directoryPath?: string): Promise<void> => {
      if (!window.quiverApi) {
        setIsLoadingCredentials(false);
        return;
      }

      setIsLoadingCredentials(true);
      const stopLoading = beginLoading("Loading AWS credentials...");

      try {
        const result =
          directoryPath != null && directoryPath.trim().length > 0
            ? await window.quiverApi.listAwsCredentialProfilesFromDirectory(directoryPath)
            : await window.quiverApi.listAwsCredentialProfiles();

        setCredentialProfiles(result.profiles);
        setCredentialLoadError(result.errorMessage ?? null);

        setSelectedCredentialName((previousName) => {
          if (previousName.length === 0) {
            return previousName;
          }

          const stillExists = result.profiles.some((profile) => profile.name === previousName);
          return stillExists ? previousName : "";
        });
      } catch (error) {
        setCredentialProfiles([]);
        setCredentialLoadError("予期せぬエラーが発生しました。");
        showUnexpectedError(error, "renderer:list-credential-profiles");
      } finally {
        stopLoading();
        setIsLoadingCredentials(false);
      }
    },
    [beginLoading, showUnexpectedError]
  );

  const handleSelectCredentialsDirectory = async (): Promise<void> => {
    if (!window.quiverApi) {
      return;
    }

    const stopLoading = beginLoading("Selecting credentials directory...");

    try {
      const selection = await window.quiverApi.selectAwsCredentialsDirectory();
      if (selection.canceled || selection.directoryPath == null) {
        return;
      }

      setSelectedCredentialsDirectory(selection.directoryPath);
      await loadCredentialProfiles(selection.directoryPath);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (initialValues == null) {
      lastAppliedInitialValuesKeyRef.current = null;
      pendingInitialClusterArnRef.current = null;
      setProfileName("");
      setSelectedCredentialName("");
      setSelectedRegion("");
      setSelectedCredentialsDirectory(null);
      setClusterInputMode("select");
      setSelectedClusterArn("");
      setSelectedClusterEngine("");
      setDirectClusterArn("");
      setDirectClusterEngine("");
      setSecretsManagerArn("");
      setDatabaseName("");
      return;
    }

    const initialValuesKey = JSON.stringify({
      profileName: initialValues.profileName ?? "",
      profileCredentialName: initialValues.profileCredentialName ?? "",
      region: initialValues.region ?? "",
      credentialsDirectory: initialValues.credentialsDirectory ?? null,
      clusterArn: initialValues.clusterArn ?? "",
      secretArn: initialValues.secretArn ?? "",
      database: initialValues.database ?? "",
      engine: initialValues.engine ?? "",
    });

    if (lastAppliedInitialValuesKeyRef.current === initialValuesKey) {
      return;
    }

    lastAppliedInitialValuesKeyRef.current = initialValuesKey;

    setProfileName(initialValues.profileName ?? "");
    setSelectedCredentialName(initialValues.profileCredentialName ?? "");
    setSelectedRegion(initialValues.region ?? "");
    setSelectedCredentialsDirectory(initialValues.credentialsDirectory ?? null);
    setClusterInputMode("select");
    setSelectedClusterArn(initialValues.clusterArn ?? "");
    setSelectedClusterEngine(initialValues.engine ?? "");
    setDirectClusterArn(initialValues.clusterArn ?? "");
    setDirectClusterEngine(initialValues.engine ?? "");
    pendingInitialClusterArnRef.current = initialValues.clusterArn ?? "";
    setSecretsManagerArn(initialValues.secretArn ?? "");
    setDatabaseName(initialValues.database ?? "");
  }, [initialValues]);

  const handleCredentialChange = (name: string | null): void => {
    const nextName = name ?? "";
    setSelectedCredentialName(nextName);

    const profile = credentialProfiles.find((candidate) => candidate.name === nextName);
    const hasKnownRegion =
      profile?.region != null && AWS_REGIONS.some((region) => region.code === profile.region);

    if (hasKnownRegion && profile?.region != null) {
      setSelectedRegion(profile.region);
    }
  };

  const fetchDbClusters = useCallback(async (): Promise<void> => {
    if (!window.quiverApi || selectedCredentialName.length === 0 || selectedRegion.length === 0) {
      setDbClusters([]);
      return;
    }

    setIsLoadingClusters(true);
    const stopLoading = beginLoading("Loading clusters...");

    try {
      const result = await window.quiverApi.listDbClusters({
        profileName: selectedCredentialName,
        region: selectedRegion,
        credentialsDirectory: selectedCredentialsDirectory ?? undefined,
      });

      if (result.error != null) {
        setDbClusters([]);
        showErrorDialog("Execution Error", result.error.message, result.error.details);
        return;
      }

      setDbClusters(result.clusters);

      if (selectedClusterArn.length > 0) {
        const matchedCluster = result.clusters.find(
          (cluster) => cluster.clusterArn === selectedClusterArn
        );

        if (matchedCluster != null) {
          setSelectedClusterArn(matchedCluster.clusterArn);
          setSelectedClusterEngine(matchedCluster.engine);
        }
      }

      if (pendingInitialClusterArnRef.current != null) {
        const initialClusterArn = pendingInitialClusterArnRef.current;
        const matchedCluster = result.clusters.find(
          (cluster) => cluster.clusterArn === initialClusterArn
        );

        if (initialClusterArn.length > 0 && matchedCluster == null) {
          setClusterInputMode("direct-arn");
          setDirectClusterArn(initialClusterArn);
        }

        if (matchedCluster != null) {
          setClusterInputMode("select");
          setSelectedClusterArn(matchedCluster.clusterArn);
          setSelectedClusterEngine(matchedCluster.engine);
          setDirectClusterEngine(matchedCluster.engine);
        }

        pendingInitialClusterArnRef.current = null;
      }
    } catch (error) {
      setDbClusters([]);
      showUnexpectedError(error, "renderer:list-db-clusters");
    } finally {
      stopLoading();
      setIsLoadingClusters(false);
    }
  }, [
    beginLoading,
    selectedCredentialName,
    selectedRegion,
    selectedCredentialsDirectory,
    selectedClusterArn,
    showErrorDialog,
    showUnexpectedError,
  ]);

  useEffect(() => {
    const initialDirectory = initialValues?.credentialsDirectory;
    void loadCredentialProfiles(initialDirectory ?? undefined);
  }, [initialValues?.credentialsDirectory, loadCredentialProfiles]);

  useEffect(() => {
    void fetchDbClusters();
  }, [fetchDbClusters]);

  useEffect(() => {
    onChange?.({
      profileName,
      profileCredentialName: selectedCredentialName,
      region: selectedRegion,
      credentialsDirectory: selectedCredentialsDirectory,
      clusterArn: effectiveClusterArn,
      secretArn: secretsManagerArn,
      database: databaseName,
      engine: effectiveClusterEngine,
    });
  }, [
    onChange,
    profileName,
    selectedCredentialName,
    selectedRegion,
    selectedCredentialsDirectory,
    effectiveClusterArn,
    effectiveClusterEngine,
    secretsManagerArn,
    databaseName,
  ]);

  return (
    <Card className="rounded-lg border border-[#bac9cc] bg-white shadow-sm">
      <CardContent className="space-y-6 p-8">
        <FormField
          helperText="A unique name to identify this connection profile."
          id="profile-name"
          label="Profile Name"
        >
          <Input
            data-testid="profile-name-input"
            id="profile-name"
            onChange={(event) => setProfileName(event.target.value)}
            className="h-10 rounded border-[#bac9cc] bg-white"
            value={profileName}
          />
        </FormField>

        <Separator className="bg-[#bac9cc]" />

        <div className="grid grid-cols-1 items-end gap-6 xl:grid-cols-2">
          <div>
            <div className="mb-2 flex min-h-6 items-center justify-between">
              <label className="stitch-label-md text-slate-900" htmlFor="aws-credentials">
                AWS Credentials
              </label>
              <Button
                data-testid="credentials-directory-button"
                className="stitch-label-md h-auto rounded px-2 py-1 text-[#006875] hover:bg-[#00e5ff]/10"
                disabled={isLoadingCredentials}
                onClick={() => {
                  void handleSelectCredentialsDirectory();
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <FolderOpen aria-hidden="true" size={18} strokeWidth={2} />
                Choose directory
              </Button>
            </div>

            <Select onValueChange={handleCredentialChange} value={selectedCredentialName}>
              <SelectTrigger
                data-testid="credential-select"
                className="h-10 w-full rounded border-[#bac9cc] bg-white"
                id="aws-credentials"
              >
                <SelectValue
                  placeholder={
                    isLoadingCredentials
                      ? "Loading credentials..."
                      : credentialProfiles.length > 0
                        ? "Choose credentials..."
                        : "No AWS profiles found"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {credentialProfiles.map((credential) => (
                  <SelectItem key={credential.name} value={credential.name}>
                    {credential.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {credentialLoadError != null ? (
              <p className="stitch-body-sm mt-1 text-red-600">{credentialLoadError}</p>
            ) : null}
            {selectedCredentialsDirectory != null && selectedCredentialsDirectory.length > 0 ? (
              <p
                className="stitch-body-sm mt-1 truncate text-slate-500"
                title={selectedCredentialsDirectory}
              >
                Directory: {selectedCredentialsDirectory}
              </p>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex min-h-6 items-center">
              <label className="stitch-label-md text-slate-900" htmlFor="aws-region">
                AWS Region
              </label>
            </div>
            <Select
              onValueChange={(nextRegion) => {
                setSelectedRegion(nextRegion ?? "");
              }}
              value={selectedRegion}
            >
              <SelectTrigger
                data-testid="region-select"
                className="h-10 w-full rounded border-[#bac9cc] bg-white"
                id="aws-region"
              >
                <SelectValue placeholder="Choose region..." />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <FormField helperText="" id="database-instance" label="Database Instance / Cluster">
          <fieldset className="mb-4 space-y-2">
            <legend className="sr-only">Cluster input mode</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded border border-[#bac9cc] p-3 transition-colors hover:bg-slate-50">
              <input
                data-testid="cluster-select-radio"
                checked={clusterInputMode === "select"}
                className="stitch-radio mt-[2px]"
                name="cluster-input-mode"
                onChange={() => setClusterInputMode("select")}
                type="radio"
                value="select"
              />
              <span className="space-y-0.5">
                <span className="stitch-body-md block font-medium text-slate-900">
                  Select from available clusters
                </span>
                <span className="stitch-body-sm block text-slate-600">
                  Choose a Data API-enabled Aurora cluster from your AWS account.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded border border-[#bac9cc] p-3 transition-colors hover:bg-slate-50">
              <input
                data-testid="cluster-direct-arn-radio"
                checked={clusterInputMode === "direct-arn"}
                className="stitch-radio mt-[2px]"
                name="cluster-input-mode"
                onChange={() => setClusterInputMode("direct-arn")}
                type="radio"
                value="direct-arn"
              />
              <span className="space-y-0.5">
                <span className="stitch-body-md block font-medium text-slate-900">
                  Enter Cluster ARN directly
                </span>
                <span className="stitch-body-sm block text-slate-600">
                  Paste the Aurora cluster ARN when you already know the target cluster.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="stitch-body-sm text-muted-foreground">
              {clusterInputMode === "direct-arn"
                ? "Enter the full ARN for the Aurora cluster you want to use."
                : selectedCredentialName.length === 0 || selectedRegion.length === 0
                  ? "Select AWS credentials and a region to load available clusters."
                  : isLoadingClusters
                    ? "Loading clusters..."
                    : dbClusters.length > 0
                      ? "Select a cluster from the list below."
                      : "No Data API-enabled Aurora clusters were found for this selection."}
            </p>
          </div>

          {clusterInputMode === "select" ? (
            <div className="flex gap-2">
              <Select
                onValueChange={(nextArn) => {
                  const normalizedArn = nextArn ?? "";
                  const cluster = dbClusters.find(
                    (candidate) => candidate.clusterArn === normalizedArn
                  );
                  setSelectedClusterArn(normalizedArn);
                  setSelectedClusterEngine(cluster?.engine ?? "");
                  if (normalizedArn.length > 0) {
                    setDirectClusterArn(normalizedArn);
                    setDirectClusterEngine(cluster?.engine ?? "");
                  }
                }}
                value={selectedClusterArn}
              >
                <SelectTrigger
                  className="h-10 w-full rounded border-[#bac9cc] bg-white"
                  id="database-instance"
                >
                  <span data-testid="cluster-select-dropdown" className="sr-only" />
                  <SelectValue
                    placeholder={
                      isLoadingClusters
                        ? "Loading clusters..."
                        : dbClusters.length > 0
                          ? "Select a cluster..."
                          : "No clusters available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {dbClusters.map((cluster) => (
                    <SelectItem key={cluster.clusterArn} value={cluster.clusterArn}>
                      {cluster.identifier}
                      {cluster.endpoint != null && cluster.endpoint.length > 0
                        ? ` — ${cluster.endpoint}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                data-testid="refresh-clusters-button"
                disabled={selectedCredentialName.length === 0 || selectedRegion.length === 0}
                onClick={() => {
                  void fetchDbClusters();
                }}
                size="icon"
                type="button"
                variant="outline"
                className="h-10 w-10 rounded border-[#bac9cc] bg-white"
              >
                <span className="sr-only">Refresh clusters</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
              </Button>
            </div>
          ) : (
            <Input
              data-testid="cluster-arn-input"
              className="h-10 rounded border-[#bac9cc] bg-white font-mono text-[13px]"
              id="database-instance"
              onChange={(event) => {
                setDirectClusterArn(event.target.value);
                setDirectClusterEngine("");
              }}
              value={directClusterArn}
            />
          )}
        </FormField>

        <Separator className="bg-[#bac9cc]" />

        <fieldset className="space-y-2">
          <legend className="stitch-label-md text-slate-700">Authentication Method</legend>
          <label className="flex cursor-pointer items-start gap-3 rounded border border-border p-3 transition-colors hover:bg-slate-50">
            <input
              defaultChecked
              className="stitch-radio mt-[2px]"
              name="authentication-method"
              type="radio"
              value="secrets-manager"
            />
            <span className="space-y-0.5">
              <span className="stitch-body-md block font-medium text-slate-900">
                AWS Secrets Manager
              </span>
              <span className="stitch-body-sm block text-slate-600">
                Recommended for automated and secure credential retrieval.
              </span>
            </span>
          </label>
        </fieldset>

        <FormField helperText="" id="secrets-manager-arn" label="Secrets Manager ARN" mono>
          <Input
            data-testid="secrets-arn-input"
            className="h-10 rounded border-[#bac9cc] bg-white font-mono text-[13px]"
            id="secrets-manager-arn"
            onChange={(event) => setSecretsManagerArn(event.target.value)}
            value={secretsManagerArn}
          />
        </FormField>

        <FormField helperText="" id="database-name" label="Database / Schema Name">
          <Input
            data-testid="database-name-input"
            className="h-10 rounded border-[#bac9cc] bg-white font-mono text-[13px]"
            id="database-name"
            onChange={(event) => setDatabaseName(event.target.value)}
            value={databaseName}
          />
        </FormField>
      </CardContent>
    </Card>
  );
}
