import { Container } from './container';
import { Spinner } from './ui/spinner';

interface LoadingViewProps {
  /** The message to display below the spinner. */
  message: string;
}

/**
 * Full-page loading indicator shown while an async flow (sign-out, an OAuth
 * redirect handoff, etc.) is in progress. Renders a spinner and a status
 * message inside a centered card container.
 */
export function LoadingView({ message }: LoadingViewProps) {
  return (
    <Container className="max-w-sm">
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <Spinner />
        <p className="text-sm">{message}</p>
      </div>
    </Container>
  );
}
