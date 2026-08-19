import { Info, Plus, Settings, TerminalSquare } from "lucide-react";
import type React from "react";
import quiverIcon from "../assets/quiver-icon.ico";

type AppSidebarProps = {
  isInfoActive: boolean;
  isQueryEditorActive: boolean;
  isNewProfileActive: boolean;
  onInfoClick: () => void;
  onQueryEditorClick: () => void;
  onNewProfileClick: () => void;
};

export function AppSidebar({
  isInfoActive,
  isQueryEditorActive,
  isNewProfileActive,
  onInfoClick,
  onQueryEditorClick,
  onNewProfileClick,
}: AppSidebarProps): React.JSX.Element {
  const baseNavButtonClass =
    "flex h-12 w-full items-center justify-center border-l-4 transition-all duration-200";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-20 border-r border-[#1E293B] bg-[#0B0E21]">
      <div className="flex h-16 items-center justify-center border-b border-[#1E293B]">
        <img src={quiverIcon} alt="Quiver" className="h-10 w-10 object-contain" />
      </div>

      <nav aria-label="Primary navigation" className="flex h-[calc(100vh-4rem)] flex-col">
        <ul className="flex list-none flex-col gap-1 py-2">
          <li>
            <button
              className={`${baseNavButtonClass} ${
                isQueryEditorActive
                  ? "border-[#9CF0FF] bg-[#006875]/20 text-[#9CF0FF] shadow-[0_0_15px_rgba(0,218,243,0.12)]"
                  : "border-transparent text-[#E0E3FF]/60 hover:bg-white/5 hover:text-[#E0E3FF]"
              }`}
              onClick={onQueryEditorClick}
              type="button"
              aria-current={isQueryEditorActive ? "page" : undefined}
              aria-label="Query Editor"
              title="Query Editor"
            >
              <TerminalSquare aria-hidden="true" size={20} strokeWidth={2.25} />
            </button>
          </li>
          <li>
            <button
              className={`${baseNavButtonClass} ${
                isNewProfileActive
                  ? "border-[#9CF0FF] bg-[#006875]/20 text-[#9CF0FF] shadow-[0_0_15px_rgba(0,218,243,0.12)]"
                  : "border-transparent text-[#E0E3FF]/60 hover:bg-white/5 hover:text-[#E0E3FF]"
              }`}
              onClick={onNewProfileClick}
              type="button"
              aria-current={isNewProfileActive ? "page" : undefined}
              aria-label="New Profile"
              title="New Profile"
            >
              <Plus aria-hidden="true" size={20} strokeWidth={2.25} />
            </button>
          </li>
        </ul>

        <div className="mt-auto border-t border-[#1E293B] py-3">
          <div className="flex h-10 w-full items-center justify-center text-[#E0E3FF]/60 transition-colors hover:bg-white/5 hover:text-[#E0E3FF]">
            <Settings aria-hidden="true" size={20} strokeWidth={2.1} />
          </div>
          <button
            className={`${baseNavButtonClass} ${
              isInfoActive
                ? "border-[#9CF0FF] bg-[#006875]/20 text-[#9CF0FF] shadow-[0_0_15px_rgba(0,218,243,0.12)]"
                : "border-transparent text-[#E0E3FF]/60 hover:bg-white/5 hover:text-[#E0E3FF]"
            }`}
            onClick={onInfoClick}
            type="button"
            aria-current={isInfoActive ? "page" : undefined}
            aria-label="Info"
            title="Info"
          >
            <Info aria-hidden="true" size={20} strokeWidth={2.1} />
          </button>
        </div>
      </nav>
    </aside>
  );
}
