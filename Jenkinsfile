pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
    }
    
    stages {
        stage('Verify Tools') {
            steps {
                bat '''
                    where gcloud || echo "ERROR: gcloud not in PATH"
                    where zip || echo "WARNING: zip not available"
                '''
            }
        }
        
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/NikhilPalliCode/rpnCalculator.git'
            }
        }
        
        stage('Build') {
            steps {
                powershell '''
                    if (Test-Path _temp) { Remove-Item _temp -Recurse -Force }
                    New-Item -ItemType Directory -Path _temp
                    Get-ChildItem -Exclude "*.git*","*.json","_temp" | 
                        Copy-Item -Destination _temp -Recurse
                    if (Get-ChildItem _temp) {
                        Compress-Archive -Path _temp/* -DestinationPath rpn-calculator.zip -Force
                    } else {
                        Write-Error "No files to compress!"
                        exit 1
                    }
                    Remove-Item _temp -Recurse -Force
                '''
            }
        }
        
        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gcloud auth activate-service-account --key-file="%GCP_KEY%"
                        gcloud config set project %GCP_PROJECT%
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gsutil cp rpn-calculator.zip gs://%GCS_BUCKET%/builds/%BUILD_NUMBER%.zip
                        gcloud builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%:%BUILD_NUMBER%
                        gcloud run deploy %APP_NAME% ^
                          --image gcr.io/%GCP_PROJECT%/%APP_NAME%:%BUILD_NUMBER% ^
                          --platform managed ^
                          --region us-central1 ^
                          --allow-unauthenticated
                    '''
                }
            }
        }
    }
    
    post {
        always {
            bat 'del rpn-calculator.zip 2>nul || echo "No zip to delete"'
        }
    }
}
