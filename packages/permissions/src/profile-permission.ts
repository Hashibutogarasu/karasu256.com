import { AbstractPermission } from './abstract-permission';
import { Actions } from './actions';

const PROFILE_PERMISSION_IDS = {
  [Actions.Read]: 0,
  [Actions.Write]: 1,
} as const;

type ProfileAction = keyof typeof PROFILE_PERMISSION_IDS;

/** Permission over the authenticated user's own profile. */
export class ProfilePermission extends AbstractPermission {
  constructor(private readonly profileAction: ProfileAction) {
    super();
  }

  resource(): string {
    return 'profile';
  }

  action(): ProfileAction {
    return this.profileAction;
  }

  id(): number {
    return PROFILE_PERMISSION_IDS[this.profileAction];
  }
}
