-- Try different formats for the managed identity name

-- Option 1: Try hostname format
BEGIN TRY
    CREATE USER [victorious-field-05d13d20f] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [victorious-field-05d13d20f];
    ALTER ROLE db_datawriter ADD MEMBER [victorious-field-05d13d20f];
    PRINT 'Successfully created user with hostname format';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with hostname format: ' + ERROR_MESSAGE();
END CATCH

-- Option 2: Try with resource type prefix
BEGIN TRY
    CREATE USER [staticapp-salyersaipmapp] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [staticapp-salyersaipmapp];
    ALTER ROLE db_datawriter ADD MEMBER [staticapp-salyersaipmapp];
    PRINT 'Successfully created user with resource type prefix';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with resource type prefix: ' + ERROR_MESSAGE();
END CATCH

-- Option 3: Try with resource type prefix and hostname
BEGIN TRY
    CREATE USER [staticapp-victorious-field-05d13d20f] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [staticapp-victorious-field-05d13d20f];
    ALTER ROLE db_datawriter ADD MEMBER [staticapp-victorious-field-05d13d20f];
    PRINT 'Successfully created user with resource type prefix and hostname';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with resource type prefix and hostname: ' + ERROR_MESSAGE();
END CATCH

-- Option 4: Try with full URL hostname
BEGIN TRY
    CREATE USER [victorious-field-05d13d20f.6.azurestaticapps.net] FROM EXTERNAL PROVIDER;
    ALTER ROLE db_datareader ADD MEMBER [victorious-field-05d13d20f.6.azurestaticapps.net];
    ALTER ROLE db_datawriter ADD MEMBER [victorious-field-05d13d20f.6.azurestaticapps.net];
    PRINT 'Successfully created user with full URL hostname';
END TRY
BEGIN CATCH
    PRINT 'Error creating user with full URL hostname: ' + ERROR_MESSAGE();
END CATCH 