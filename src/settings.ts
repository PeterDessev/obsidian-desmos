import Desmos from "./main";
import { PluginSettingTab, App, Setting } from "obsidian";

export enum CacheLocation {
    Memory = "Memory",
    Filesystem = "Filesystem",
}

export interface Settings {
    /** The program version these settings were created in */
    version: string;
    // /** The debounce timer (in ms) */
    // debounce: number;
    cache: CacheSettings;
    customColors: string;
}

export interface CacheSettings {
    enabled: boolean;
    location: CacheLocation;
    directory?: string;
}

const DEFAULT_SETTINGS_STATIC: Omit<Settings, "version"> = {
    // debounce: 500,
    cache: {
        enabled: true,
        location: CacheLocation.Memory,
    },
    customColors:
        "red: #c74440\n" +
        "blue: #2d70b3\n" +
        "green: #388c46\n" +
        "orange: #fa7e19\n" +
        "purple: #6042a6\n" +
        "black: #000000\n      ",
};

/** Get the default settings for the given plugin. This simply uses `DEFAULT_SETTINGS_STATIC` and patches the version from the manifest. */
export function DEFAULT_SETTINGS(plugin: Desmos): Settings {
    return {
        version: plugin.manifest.version,
        ...DEFAULT_SETTINGS_STATIC,
    };
}

/** Attempt to migrate the given settings object to the current structure */
export function migrateSettings(plugin: Desmos, settings: object): Settings {
    // todo (there is currently only one version of the settings interface)
    return settings as Settings;
}

export class SettingsTab extends PluginSettingTab {
    plugin: Desmos;

    constructor(app: App, plugin: Desmos) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        // new Setting(containerEl)
        //     .setName("Debounce Time (ms)")
        //     .setDesc(
        //         "How long to wait after a keypress to render the graph (set to 0 to disable, requires restart to take effect)"
        //     )
        //     .addText((text) =>
        //         text.setValue(this.plugin.settings.debounce.toString()).onChange(async (value) => {
        //             const val = parseInt(value);
        //             this.plugin.settings.debounce =
        //                 Number.isNaN(val) || val < 0 ? DEFAULT_SETTINGS_STATIC.debounce : val;
        //             await this.plugin.saveSettings();
        //         })
        //     );

        new Setting(containerEl)
            .setName("Cache")
            .setDesc("Whether to cache the rendered graphs")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.cache.enabled).onChange(async (value) => {
                    this.plugin.settings.cache.enabled = value;
                    await this.plugin.saveSettings();

                    // Reset the display so the new state can render
                    this.display();
                })
            );

        if (this.plugin.settings.cache.enabled) {
            new Setting(containerEl)
                .setName("Cache location")
                .setDesc("Set the location to cache rendered graphs (note that memory caching is not persistent)")
                .addDropdown((dropdown) =>
                    dropdown
                        .addOption(CacheLocation.Memory, "Memory")
                        .addOption(CacheLocation.Filesystem, "Filesystem")
                        .setValue(this.plugin.settings.cache.location)
                        .onChange(async (value) => {
                            this.plugin.settings.cache.location = value as CacheLocation;
                            await this.plugin.saveSettings();

                            // Reset the display so the new state can render
                            this.display();
                        })
                );

            if (this.plugin.settings.cache.location === CacheLocation.Filesystem) {
                new Setting(containerEl)
                    .setName("Cache Directory")
                    .setDesc(
                        `The directory to save cached graphs in, relative to the vault root (technical note: the graphs will be saved as \`desmos-graph-<hash>.svg\` where the name is a SHA-256 hash of the graph source). Also note that a lot of junk will be saved to this folder, you have been warned.`
                    )
                    .addText((text) => {
                        text.setValue(this.plugin.settings.cache.directory ?? "").onChange(async (value) => {
                            this.plugin.settings.cache.directory = value;
                            await this.plugin.saveSettings();
                        });
                    });
            }
        }

        new Setting(containerEl)
            .setName("Custom Color Names")
            .setDesc(
                'Path leading to custom colors file. Custom colors should be organised in "Name, ColorValue" pairs.\
                In order to use a custom color, add "|--Name" to any graph.'
            )
            .setClass("text-snippets-class")
            .addTextArea((text) =>
                text.setValue(this.plugin.settings.customColors).onChange(async (value) => {
                    this.plugin.settings.customColors = value;

                    // Remove trailing newlines
                    while (value.slice(-1) == "\n") {
                        value = value.slice(0, -1);
                    }

                    // split array into key value pairs
                    this.plugin.customColorsArray = value
                        .split("\n")
                        .map((item) => item.split(":").map((item) => item.trim()));

                    await this.plugin.saveSettings();
                })
            );
    }
}
