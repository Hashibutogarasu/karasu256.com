"use client";

import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import { toast } from "@Hashibutogarasu/ui";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { Button } from "@Hashibutogarasu/ui";

/**
 * Renders Google and GitHub OAuth sign-in buttons that use Firebase Auth
 * popup flow. Both providers must be enabled in the Firebase console.
 */
export function SocialButtons() {
  async function handleGoogle() {
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleGitHub() {
    try {
      await signInWithPopup(getFirebaseAuth(), new GithubAuthProvider());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={handleGoogle}>
        <FontAwesomeIcon icon={faGoogle} />
        Google
      </Button>
      <Button variant="outline" onClick={handleGitHub}>
        <FontAwesomeIcon icon={faGithub} />
        GitHub
      </Button>
    </div>
  );
}
