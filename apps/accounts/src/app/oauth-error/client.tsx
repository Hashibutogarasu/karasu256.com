"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { Container, CardContent, CardHeader } from "@Hashibutogarasu/ui"
import { Button } from "@Hashibutogarasu/ui"

/**
 * Displays an error message when the OAuth sign-in flow fails, with a link
 * to return to the sign-in page.
 */
export function OAuthErrorClient() {
  const { t } = useTranslation()

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">
        {t("oauthError.title")}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("oauthError.message")}</p>
        <Button variant="outline" className="w-full" onClick={() => { window.location.href = "/" }}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t("oauthError.backToSignIn")}
        </Button>
      </CardContent>
    </Container>
  )
}
