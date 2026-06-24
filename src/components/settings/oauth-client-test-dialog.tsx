"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, Circle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Spinner as DefaultSpinner } from "@/components/ui/spinner";
import {
  Button,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@Hashibutogarasu/ui";
import type { OAuthClientSummary } from "@/lib/api/developer";

const STEP_LABELS = ["authorize", "access_token", "profile"] as const;
type StepLabel = typeof STEP_LABELS[number];
type StepStatus = "waiting" | "running" | "success" | "error";

interface StepState {
  label: StepLabel;
  status: StepStatus;
  data?: Record<string, unknown>;
  error?: string;
}

interface ServerStep {
  label: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface OAuthClientTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: OAuthClientSummary;
  /** Overrides the default spinner shown while a step is in progress. */
  spinner?: React.ComponentType<{ className?: string }>;
}

function makeInitialSteps(): StepState[] {
  return STEP_LABELS.map((label) => ({ label, status: "waiting" }));
}

/**
 * Dialog that tests the full OAuth flow for the given client by opening the
 * real authorization page in a popup window. All steps are shown upfront with
 * a status icon that reflects waiting / running / success / error state.
 */
export function OAuthClientTestDialog({
  open,
  onOpenChange,
  client,
  spinner: SpinnerComponent = DefaultSpinner,
}: OAuthClientTestDialogProps) {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<StepState[]>(makeInitialSteps);
  const popupRef = useRef<Window | null>(null);
  const clientIdRef = useRef(client.id);

  useEffect(() => {
    clientIdRef.current = client.id;
  }, [client.id]);

  const isRunning = steps.some((s) => s.status === "running");
  const isWaitingForCode = steps[0].status === "running";
  const hasStarted = steps.some((s) => s.status !== "waiting");
  const allPassed = hasStarted && !isRunning && steps.every((s) => s.status === "success");

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || (event.data as Record<string, unknown>).type !== "oauth_test_callback") return;

      const { code, error } = event.data as { type: string; code?: string; error?: string };

      if (error || !code) {
        setSteps((prev) =>
          prev.map((s) =>
            s.label === "authorize"
              ? { ...s, status: "error", error: error ?? "access_denied" }
              : s,
          ),
        );
        return;
      }

      setSteps((prev) =>
        prev.map((s) => {
          if (s.label === "authorize") return { ...s, status: "success" };
          if (s.label === "access_token") return { ...s, status: "running" };
          return s;
        }),
      );

      void (async () => {
        try {
          const res = await fetch(`/api/oauth/clients/${clientIdRef.current}/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });

          if (!res.ok) {
            setSteps((prev) =>
              prev.map((s) =>
                s.label === "access_token"
                  ? { ...s, status: "error", error: res.statusText }
                  : s,
              ),
            );
            return;
          }

          const { steps: serverSteps } = (await res.json()) as { steps: ServerStep[] };

          setSteps((prev) =>
            prev.map((s) => {
              const found = serverSteps.find((ss) => ss.label === s.label);
              if (!found) return s;
              return {
                ...s,
                status: found.success ? "success" : "error",
                data: found.data,
                error: found.error,
              };
            }),
          );
        } catch (err) {
          setSteps((prev) =>
            prev.map((s) =>
              s.label === "access_token"
                ? { ...s, status: "error", error: String(err) }
                : s,
            ),
          );
        }
      })();
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!isWaitingForCode) return;

    const interval = setInterval(() => {
      if (!popupRef.current?.closed) return;
      setSteps((prev) => {
        if (prev[0].status !== "running") return prev;
        return prev.map((s) =>
          s.label === "authorize"
            ? { ...s, status: "error", error: t("settings.developer.test.popupClosed") }
            : s,
        );
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isWaitingForCode, t]);

  function startTest() {
    const redirectUri = client.callbackUris[0];
    if (!redirectUri) {
      setSteps((prev) =>
        prev.map((s) =>
          s.label === "authorize"
            ? { ...s, status: "error", error: t("settings.developer.test.noCallbackUri") }
            : s,
        ),
      );
      return;
    }

    setSteps(
      makeInitialSteps().map((s) =>
        s.label === "authorize" ? { ...s, status: "running" } : s,
      ),
    );

    const url =
      `/oauth/authorize?` +
      new URLSearchParams({
        client_id: client.id,
        redirect_uri: redirectUri,
        response_type: "code",
        permissions: String(client.permissions),
        state: crypto.randomUUID(),
      }).toString();

    const popup = window.open(url, "oauth_test", "popup=yes,width=520,height=640");
    if (!popup) {
      setSteps((prev) =>
        prev.map((s) =>
          s.label === "authorize"
            ? { ...s, status: "error", error: t("settings.developer.test.popupBlocked") }
            : s,
        ),
      );
      return;
    }
    popupRef.current = popup;
  }

  function cancelTest() {
    popupRef.current?.close();
    popupRef.current = null;
    setSteps(makeInitialSteps());
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      popupRef.current?.close();
      popupRef.current = null;
      setSteps(makeInitialSteps());
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="max-w-md w-full p-6 space-y-4">
          <DialogTitle>{t("settings.developer.test.title", { name: client.name })}</DialogTitle>

          <div className="space-y-2">
            {steps.map((step) => (
              <StepRow key={step.label} step={step} spinner={SpinnerComponent} />
            ))}
            {allPassed && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium pt-1">
                {t("settings.developer.test.allPassed")}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {isWaitingForCode ? (
              <Button variant="ghost" onClick={cancelTest}>
                {t("settings.developer.dialog.cancel")}
              </Button>
            ) : (
              <DialogClose
                render={
                  <Button variant="ghost">
                    {t("settings.developer.dialog.done")}
                  </Button>
                }
              />
            )}
            <Button onClick={startTest} disabled={isRunning}>
              {hasStarted && !isRunning
                ? t("settings.developer.test.runAgain")
                : t("settings.developer.test.run")}
            </Button>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function StepIcon({
  status,
  spinner: SpinnerComponent,
}: {
  status: StepStatus;
  spinner: React.ComponentType<{ className?: string }>;
}) {
  switch (status) {
    case "waiting":
      return <Circle className="size-4 text-muted-foreground" />;
    case "running":
      return <SpinnerComponent className="size-4 text-orange-500" />;
    case "success":
      return <CheckCircle className="size-4 text-green-600 dark:text-green-400" />;
    case "error":
      return <XCircle className="size-4 text-destructive" />;
  }
}

function StepRow({
  step,
  spinner,
}: {
  step: StepState;
  spinner: React.ComponentType<{ className?: string }>;
}) {
  const { t } = useTranslation();
  const labelKey = `settings.developer.test.steps.${step.label}`;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border px-3 py-2.5">
      <span className="mt-0.5 shrink-0">
        <StepIcon status={step.status} spinner={spinner} />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{t(labelKey, { defaultValue: step.label })}</p>
        {step.status === "success" && step.data && (
          <div className="space-y-0.5">
            {Object.entries(step.data).map(([k, v]) => (
              <p key={k} className="text-xs text-muted-foreground font-mono truncate">
                {k}: {String(v)}
              </p>
            ))}
          </div>
        )}
        {step.status === "error" && step.error && (
          <p className="text-xs text-destructive">{step.error}</p>
        )}
      </div>
    </div>
  );
}
