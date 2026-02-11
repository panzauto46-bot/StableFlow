package com.stableflow.app;

import android.app.Application;
import android.content.Context;

import com.google.firebase.FirebaseApp;
import com.stableflow.app.util.LocaleHelper;

/**
 * StableFlowApp
 * Main Application class for initialization
 * Includes Firebase and locale setup for multi-language support
 */
public class StableFlowApp extends Application {

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.onAttach(base));
    }

    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize Firebase
        FirebaseApp.initializeApp(this);
    }
}
