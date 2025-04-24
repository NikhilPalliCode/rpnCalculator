pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
        GCLOUD_PATH = 'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd'
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
                    New-Item -ItemType Directory -Path temp -Force | Out-Null
                    Copy-Item * -Destination temp -Exclude "*.git*"
                    Compress-Archive -Path temp/* -DestinationPath rpn-calculator.zip
                    Remove-Item temp -Recurse -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
        
        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat """
                        "%GCLOUD_PATH%" auth activate-service-account --key-file="%GCP_KEY%"
                        "%GCLOUD_PATH%" config set project %GCP_PROJECT%
                    """
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat """
                        "%GCLOUD_PATH%" auth activate-service-account --key-file="%GCP_KEY%"
                        "%GCLOUD_PATH%" config set project %GCP_PROJECT%
                        "%GCLOUD_PATH%" builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%
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
                def url = bat(
                    script: '"%GCLOUD_PATH%" run services describe %APP_NAME% --platform managed --region %CLOUD_RUN_REGION% --format="value(status.url)"',
                    returnStdout: true
                ).trim()
                echo "✅ Deployment Successful! Access your app at: ${url}"
            }
        }
        failure {
            script {
                mail to: 'nikhilpalle1997@gmail.com',
                     subject: "FAILED: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                     body: "Check console at ${env.BUILD_URL}"
            }
        }
        always {
            bat '''
                del rpn-calculator.zip 2>nul || echo "No zip to delete"
                rmdir /s /q temp 2>nul || echo "No temp dir to delete"
            '''
        }
    }
}
