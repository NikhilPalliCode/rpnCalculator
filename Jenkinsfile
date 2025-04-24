pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
        GCLOUD_PATH = 'gcloud' // Assuming gcloud is in PATH
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/NikhilPalliCode/rpnCalculator.git'
            }
        }
        
        stage('Build') {
            steps {
                powershell '''
                    $tempDir = "$env:WORKSPACE\\_temp"
                    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
                    Get-ChildItem -Exclude "*.git*", "_temp", "Jenkinsfile" | 
                        Copy-Item -Destination $tempDir -Recurse -Force
                    Compress-Archive -Path "$tempDir\\*" -DestinationPath "$env:WORKSPACE\\rpn-calculator.zip" -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip'
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    script {
                        // Authenticate and set project
                        bat """
                            "${GCLOUD_PATH}" auth activate-service-account --key-file="${GCP_KEY}"
                            "${GCLOUD_PATH}" config set project ${GCP_PROJECT}
                        """
                        
                        // Check if service exists
                        def serviceExists = bat(
                            script: """
                                "${GCLOUD_PATH}" run services list \
                                --project=${GCP_PROJECT} \
                                --region=${CLOUD_RUN_REGION} \
                                --filter="metadata.name=${APP_NAME}" \
                                --format="value(name)"
                            """,
                            returnStdout: true
                        ).trim()
                        
                        // Deploy with appropriate parameters
                        bat """
                            "${GCLOUD_PATH}" run deploy ${APP_NAME} \
                            --image gcr.io/${GCP_PROJECT}/${APP_NAME} \
                            --platform managed \
                            --region ${CLOUD_RUN_REGION} \
                            --project ${GCP_PROJECT} \
                            --allow-unauthenticated \
                            ${serviceExists ? '' : '--quiet'}
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                // Get service URL with retries
                def url = ""
                def attempts = 3
                def delay = 10
                
                while(attempts > 0) {
                    try {
                        url = bat(
                            script: """
                                "${GCLOUD_PATH}" run services describe ${APP_NAME} \
                                --platform managed \
                                --region ${CLOUD_RUN_REGION} \
                                --project ${GCP_PROJECT} \
                                --format="value(status.url)"
                            """,
                            returnStdout: true
                        ).trim()
                        
                        if(url) {
                            echo "✅ Deployment Successful! Access your app at: ${url}"
                            break
                        }
                    } catch(e) {
                        echo "⚠️ Attempt ${4-attempts} failed to get URL"
                    }
                    attempts--
                    if(attempts > 0) {
                        sleep(delay)
                    } else {
                        echo "❌ Failed to retrieve service URL after retries"
                        echo "Check service manually using:"
                        echo "gcloud run services list --project=${GCP_PROJECT} --region=${CLOUD_RUN_REGION}"
                    }
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
