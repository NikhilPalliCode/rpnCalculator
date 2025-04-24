pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'       // Your GCP project ID
        GCS_BUCKET = 'rpn-calculator-builds'    // Your storage bucket
        APP_NAME = 'rpn-calculator'             // Your application name
        REGION = 'us-central1'                  // Deployment region
    }
    
    stages {
        // Stage 1: Checkout Code
        stage('Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/NikhilPalliCode/rpnCalculator.git'
            }
        }
        
        // Stage 2: Build & Test
        stage('Build') {
            steps {
                sh '''
                    echo "Packaging application..."
                    zip -r ${APP_NAME}.zip * -x "*.git*" "*.json"
                    ls -lah ${APP_NAME}.zip
                '''
            }
        }
        
        // Stage 3: Secure GCP Authentication
        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    sh '''
                        echo "Activating service account..."
                        gcloud auth activate-service-account --key-file=${GCP_KEY}
                        gcloud config set project ${GCP_PROJECT}
                        gcloud config get-value account
                    '''
                }
            }
        }
        
        // Stage 4: Deploy to GCP
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    sh '''
                        echo "Uploading to Cloud Storage..."
                        gsutil cp ${APP_NAME}.zip gs://${GCS_BUCKET}/builds/${BUILD_NUMBER}_${GIT_COMMIT}.zip
                        
                        echo "Building container..."
                        gcloud builds submit --tag gcr.io/${GCP_PROJECT}/${APP_NAME}:${BUILD_NUMBER}
                        
                        echo "Deploying to Cloud Run..."
                        gcloud run deploy ${APP_NAME} \
                          --image gcr.io/${GCP_PROJECT}/${APP_NAME}:${BUILD_NUMBER} \
                          --platform managed \
                          --region ${REGION} \
                          --allow-unauthenticated
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Deployment Successful!"
            sh '''
                echo "Application URL:"
                gcloud run services describe ${APP_NAME} \
                  --platform managed \
                  --region ${REGION} \
                  --format="value(status.url)"
            '''
        }
        failure {
            echo "❌ Pipeline Failed!"
            emailext (
                subject: "FAILED: ${APP_NAME} Build #${BUILD_NUMBER}",
                body: "Check console at ${BUILD_URL}",
                to: 'nikhilpalle1997@gmail.com'
            )
        }
        always {
            sh 'rm -f ${APP_NAME}.zip || true'
            archiveArtifacts artifacts: '**/*.zip', onlyIfSuccessful: false
        }
    }
}
