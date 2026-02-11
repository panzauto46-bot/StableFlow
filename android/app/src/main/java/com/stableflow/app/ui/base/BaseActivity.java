package com.stableflow.app.ui.base;

import android.content.Context;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.stableflow.app.util.LocaleHelper;

/**
 * BaseActivity
 * Base class for all activities to ensure locale is properly set
 */
public abstract class BaseActivity extends AppCompatActivity {

    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(LocaleHelper.onAttach(newBase));
    }

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
     * Recreate activity to apply new locale
     */
    protected void refreshActivity() {
        recreate();
    }
}
