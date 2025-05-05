-- Create SQL user with the exact managed identity information from the app

-- Option 1: Try with the user-assigned managed identity name from resource ID
BEGIN TRY
    CREATE USER [6aa1e9bbbc6a47319fe8d20522571a8c-mi] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [6aa1e9bbbc6a47319fe8d20522571a8c-mi];
    ALTER ROLE db_datawriter ADD MEMBER [6aa1e9bbbc6a47319fe8d20522571a8c-mi];
    PRINT 'Successfully created user with managed identity name';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with managed identity name: ' + ERROR_MESSAGE();
END CATCH

-- Option 2: Try with the Static Web App resource name
BEGIN TRY
    CREATE USER [Salyersaipmapp] FROM EXTERNAL PROVIDER WITH DEFAULT_SCHEMA = dbo;
    ALTER ROLE db_datareader ADD MEMBER [Salyersaipmapp];
    ALTER ROLE db_datawriter ADD MEMBER [Salyersaipmapp];
    PRINT 'Successfully created user with Static Web App name';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with Static Web App name: ' + ERROR_MESSAGE();
END CATCH

-- Option 3: Try with the "App Service Plan" name (functions host)
BEGIN TRY
    CREATE USER [512a7d8d-6496-498c-9e85-2e3821636f82] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [512a7d8d-6496-498c-9e85-2e3821636f82];
    ALTER ROLE db_datawriter ADD MEMBER [512a7d8d-6496-498c-9e85-2e3821636f82];
    PRINT 'Successfully created user with functions host name';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with functions host name: ' + ERROR_MESSAGE();
END CATCH 