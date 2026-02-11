package com.stableflow.app.util;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import android.preference.PreferenceManager;

import java.util.Locale;

/**
 * LocaleHelper
 * Utility class for managing app locale/language settings
 * Supports dynamic language switching without app restart
 */
public class LocaleHelper {

    private static final String SELECTED_LANGUAGE = "selected_language";
    public static final String LANGUAGE_ENGLISH = "en";
    public static final String LANGUAGE_INDONESIAN = "in";

    /**
     * Called from Application class or BaseActivity to set the locale
     */
    public static Context onAttach(Context context) {
        String lang = getPersistedLanguage(context);
        return setLocale(context, lang);
    }

    /**
     * Get the currently persisted language code
     */
    public static String getPersistedLanguage(Context context) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        return preferences.getString(SELECTED_LANGUAGE, LANGUAGE_INDONESIAN); // Default to Indonesian
    }

    /**
     * Set and persist the app language
     */
    public static Context setLocale(Context context, String language) {
        persist(context, language);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return updateResources(context, language);
        }
        return updateResourcesLegacy(context, language);
    }

    /**
     * Save the selected language to SharedPreferences
     */
    private static void persist(Context context, String language) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(SELECTED_LANGUAGE, language);
        editor.apply();
    }

    /**
     * Update resources for Android N and above
     */
    @TargetApi(Build.VERSION_CODES.N)
    private static Context updateResources(Context context, String language) {
        Locale locale = new Locale(language);
        Locale.setDefault(locale);

        Configuration configuration = context.getResources().getConfiguration();
        configuration.setLocale(locale);
        configuration.setLayoutDirection(locale);

        return context.createConfigurationContext(configuration);
    }

    /**
     * Update resources for Android versions below N
     */
    @SuppressWarnings("deprecation")
    private static Context updateResourcesLegacy(Context context, String language) {
        Locale locale = new Locale(language);
        Locale.setDefault(locale);

        Resources resources = context.getResources();
        Configuration configuration = resources.getConfiguration();
        configuration.locale = locale;
        configuration.setLayoutDirection(locale);

        resources.updateConfiguration(configuration, resources.getDisplayMetrics());

        return context;
    }

    /**
     * Get the display name of a language
     */
    public static String getLanguageDisplayName(String languageCode) {
        switch (languageCode) {
            case LANGUAGE_ENGLISH:
                return "English";
            case LANGUAGE_INDONESIAN:
                return "Bahasa Indonesia";
            default:
                return "Bahasa Indonesia";
        }
    }

    /**
     * Check if current language is English
     */
    public static boolean isEnglish(Context context) {
        return LANGUAGE_ENGLISH.equals(getPersistedLanguage(context));
    }

    /**
     * Check if current language is Indonesian
     */
    public static boolean isIndonesian(Context context) {
        return LANGUAGE_INDONESIAN.equals(getPersistedLanguage(context));
    }
}
