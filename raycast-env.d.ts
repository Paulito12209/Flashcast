/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Language - Language of the extension (affects syntax for correct/true) */
  "language": "de" | "en" | "es" | "zh" | "hi" | "ru" | "ar" | "pt" | "it" | "tr"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-card` command */
  export type CreateCard = ExtensionPreferences & {}
  /** Preferences accessible in the `list-cards` command */
  export type ListCards = ExtensionPreferences & {}
  /** Preferences accessible in the `tags` command */
  export type Tags = ExtensionPreferences & {}
  /** Preferences accessible in the `quiz` command */
  export type Quiz = ExtensionPreferences & {}
  /** Preferences accessible in the `import-cards` command */
  export type ImportCards = ExtensionPreferences & {}
  /** Preferences accessible in the `export-cards` command */
  export type ExportCards = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-card` command */
  export type CreateCard = {}
  /** Arguments passed to the `list-cards` command */
  export type ListCards = {}
  /** Arguments passed to the `tags` command */
  export type Tags = {}
  /** Arguments passed to the `quiz` command */
  export type Quiz = {}
  /** Arguments passed to the `import-cards` command */
  export type ImportCards = {}
  /** Arguments passed to the `export-cards` command */
  export type ExportCards = {}
}

