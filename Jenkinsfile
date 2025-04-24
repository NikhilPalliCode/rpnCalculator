pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
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
                    # Clean up previous temp directory if exists
                    if (Test-Path "temp") {
                        Remove-Item "temp" -Recurse -Force
                    }
                    
                    # Create new temp directory
                    New-Item -ItemType Directory -Path "temp" | Out-Null
                    
                    # Copy files excluding patterns (using Where-Object to avoid self-copy)
                    Get-ChildItem -Exclude "*.git*", "temp", "Jenkinsfile" | 
                        Where-Object { $_.FullName -ne (Resolve-Path "temp").Path } |
                        Copy-Item -Destination "temp" -Recurse -Force
                    
                    # Create zip archive
                    Compress-Archive -Path "temp\\*" -DestinationPath "rpn-calculator.zip" -Force
                    
                    # Cleanup
                    Remove-Item "temp" -Recurse -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
        
        stage('Deploy to GCP') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gcloud auth activate-service-account --key-file="%GCP_KEY%"
                        gcloud config set project %GCP_PROJECT%
                        
                        echo "Uploading to Cloud Storage..."
                        gsutil cp rpn-calculator.zip gs://%GCS_BUCKET%/builds/%BUILD_NUMBER%.zip
                        
                        echo "Building container..."
                        gcloud builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%
                        
                        echo "Deploying to Cloud Run..."
                        gcloud run deploy %APP_NAME% ^
                          --image gcr.io/%GCP_PROJECT%/%APP_NAME% ^
                          --platform managed ^
                          --region %CLOUD_RUN_REGION% ^
                          --allow-unauthenticated
                    '''
                }
            }
        }
    }
    
    post {
        always {
            bat '''
                del rpn-calculator.zip 2>nul || echo "No zip to delete"
                rmdir /s /q temp 2>nul || echo "No temp dir to delete"
            '''
        }
        success {
            script {
                def url = bat(
                    script: 'gcloud run services describe %APP_NAME% --platform managed --region %CLOUD_RUN_REGION% --format="value(status.url)"',
                    returnStdout: true
                ).trim()
                echo "✅ Deployment Successful! Access your app at: ${url}"
            }
        }
        failure {
            echo "❌ Pipeline failed! Check the console output for details."
        }
    }
}
