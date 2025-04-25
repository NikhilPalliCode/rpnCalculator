pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
        GCLOUD_PATH = 'C:\\Users\\nikhi\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/NikhilPalliCode/rpnCalculator.git'
                echo 'Code checked out successfully'
            }
        }
        
        stage('Verify Files') {
            steps {
                bat 'dir /B'
                bat 'if not exist index.html (echo index.html missing! && exit /b 1)'
                echo 'Basic file verification passed'
            }
        }
        
        stage('Package Artifact') {
            steps {
                powershell '''
                    # Create temp directory (no need to clean first)
                    $tempDir = "$env:WORKSPACE\\_temp"
                    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
                    
                    # Copy files excluding patterns
                    Get-ChildItem -Exclude "*.git*", "_temp", "Jenkinsfile" | 
                        Copy-Item -Destination $tempDir -Recurse -Force
                    
                    # Create zip archive
                    $zipPath = "$env:WORKSPACE\\rpn-calculator.zip"
                    Compress-Archive -Path "$tempDir\\*" -DestinationPath $zipPath -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
        
        stage('Deploy to GCP') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat """
                        "%GCLOUD_PATH%" auth activate-service-account --key-file="%GCP_KEY%"
                        "%GCLOUD_PATH%" config set project %GCP_PROJECT%
                        
                        echo Uploading to Cloud Storage...
                        "%GCLOUD_PATH%" storage cp rpn-calculator.zip gs://%GCS_BUCKET%/builds/%BUILD_NUMBER%.zip
                        
                        echo Building container...
                        "%GCLOUD_PATH%" builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%
                        
                        echo Deploying to Cloud Run...
                        "%GCLOUD_PATH%" run deploy %APP_NAME% ^
                          --image gcr.io/%GCP_PROJECT%/%APP_NAME% ^
                          --platform managed ^
                          --region %CLOUD_RUN_REGION% ^
                          --allow-unauthenticated
                    """
                }
            }
        }
    }
    
    post {
    success {
        script {
            try {
                // First verify the service exists
                bat """
                    "%GCLOUD_PATH%" run services list \
                    --project=%GCP_PROJECT% \
                    --region=%CLOUD_RUN_REGION% \
                    --filter="metadata.name=%APP_NAME%" \
                    --format="value(name)"
                """
                
                // Only try to get URL if service exists
                def url = bat(
                    script: '"%GCLOUD_PATH%" run services describe %APP_NAME% --platform managed --region %CLOUD_RUN_REGION% --project=%GCP_PROJECT% --format="value(status.url)"',
                    returnStdout: true
                ).trim()
                
                echo "✅ Deployment Successful! Access your app at: ${url}"
            } catch (Exception e) {
                echo "⚠️ Could not retrieve service URL. The deployment might have succeeded but:"
                echo "1. Service might not be immediately available"
                echo "2. Service might have a different name"
                echo "3. Check Cloud Run console manually: https://console.cloud.google.com/run?project=%GCP_PROJECT%"
            }
        }
    }
    always {
        bat '''
            @echo off
            del rpn-calculator.zip 2>nul
            rmdir /s /q _temp 2>nul
        '''
    }
}
}
