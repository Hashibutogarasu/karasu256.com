"use client"

import { useSearchParams } from "next/navigation"
import { useTranslation } from "react-i18next"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { Container, CardContent, CardHeader } from "@Hashibutogarasu/ui"
import { Button } from "@Hashibutogarasu/ui"

/**
 * Displays an error message when the OAuth sign-in flow fails.
 *
 * When `?reason=account_not_linked` is present, a specific message explaining
 * that the provider must be linked first is shown instead of the generic one.
 */
export function OAuthErrorClient() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  const message =
    reason === "account_not_linked"
      ? t("oauthError.accountNotLinked")
      : t("oauthError.message")

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
