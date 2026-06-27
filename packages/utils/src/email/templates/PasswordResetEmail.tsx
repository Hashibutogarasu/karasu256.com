import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl: string;
}

/**
 * Email template sent when a user requests a password reset.
 *
 * @param resetUrl - The one-time reset link including the verification token.
 */
export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>パスワードリセットのリクエスト — Karasu Lab</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>パスワードリセット</Text>
          <Text style={paragraph}>
            パスワードリセットのリクエストを受け付けました。以下のボタンをクリックして新しいパスワードを設定してください。
          </Text>
          <Section style={buttonContainer}>
            <Button href={resetUrl} style={button}>
              パスワードをリセット
            </Button>
          </Section>
          <Text style={note}>
            このリンクは15分間有効です。リクエストに心当たりがない場合は、このメールを無視してください。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "bold",
  marginTop: "48px",
  padding: "0 48px",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  padding: "0 48px",
};

const buttonContainer: React.CSSProperties = {
  padding: "0 48px",
  marginBottom: "16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#000000",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};

const note: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#6b7280",
  padding: "0 48px",
};
