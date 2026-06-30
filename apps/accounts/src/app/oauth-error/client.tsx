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
 * Renders reason-specific messages for `account_not_linked` and `user_not_found`;
 * falls back to a generic message for all other cases.
 */
export function OAuthErrorClient() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")

  const message =
    reason === "account_not_linked"
      ? t("oauthError.accountNotLinked")
      : reason === "user_not_found"
        ? t("oauthError.userNotFound")
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
