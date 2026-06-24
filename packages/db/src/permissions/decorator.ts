import { registerSection } from "./registry";

type SectionInput = {
  key: string;
  labelKey: string;
  descriptionKey?: string;
  bitIndex: number;
};

/**
 * Class decorator that registers a permission section into the global registry.
 * The decorated class itself is not modified.
 *
 * @example
 * ```ts
 * @Section({ key: "profile", labelKey: "permissions.sections.profile.label", bitIndex: 0 })
 * export class ProfileSection {}
 * ```
 */
export function Section(meta: SectionInput) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return function <T extends Function>(target: T): T {
    registerSection(meta);
    return target;
  };
}
