import { Section } from "@Hashibutogarasu/db";
export { hasPermission } from "@Hashibutogarasu/db";

/**
 * Built-in permission sections for OAuth clients.
 * bitIndex values MUST NOT change after data is written to the database.
 * labelKey and descriptionKey are i18n translation keys resolved on the client.
 */
@Section({
  key: "profile",
  labelKey: "permissions.sections.profile.label",
  descriptionKey: "permissions.sections.profile.description",
  bitIndex: 0,
})
export class ProfileSection {}

@Section({
  key: "images",
  labelKey: "permissions.sections.images.label",
  descriptionKey: "permissions.sections.images.description",
  bitIndex: 1,
})
export class ImagesSection {}
