"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { Container, CardContent, CardHeader } from "@Hashibutogarasu/ui"
import { Button } from "@Hashibutogarasu/ui"

/**
 * Displays an error message when the OAuth sign-in flow fails.
 *
 * The `reason` query parameter is used as a suffix of the `oauthError.*` i18n key,
 * falling back to `oauthError.message` when the key is absent or `reason` is missing.
 */
export function OAuthErrorClient() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  const message = useMemo(
    () => t(reason ? `oauthError.${reason}` : "oauthError.message", { defaultValue: t("oauthError.message") }),
    [reason, t],
  )

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">
        {t("oauthError.title")}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" className="w-full" onClick={() => { window.location.href = "/" }}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t("oauthError.backToSignIn")}
        </Button>
      </CardContent>
    </Container>
  )
}
