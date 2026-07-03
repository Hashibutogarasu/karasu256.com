import { Container } from './container';
import { Spinner } from './ui/spinner';

interface SigningOutViewProps {
  /** The message to display below the spinner. */
  message: string;
}

/**
 * Full-page signing-out indicator shown while the sign-out process is in progress.
 * Renders a spinner and a status message inside a centered card container.
 */
export function SigningOutView({ message }: SigningOutViewProps) {
  return (
    <Container className="max-w-sm">
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <Spinner />
        <p className="text-sm">{message}</p>
      </div>
    </Container>
  );
}
