pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'  // Your GCS bucket name
        APP_NAME = 'rpn-calculator'
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
        stage('Build & Test') {
            steps {
                sh '''
                    echo "Installing test dependencies..."
                    npm install || echo "No package.json found, skipping npm install"
                    
                    echo "Running tests..."
                    [ -f "test.js" ] && node test.js || echo "No tests found"
                    
                    echo "Building artifact..."
                    zip -r ${APP_NAME}.zip * -x "*.git*"
                '''
            }
        }
        
        // Stage 3: GCP Authentication
        stage('GCP Auth') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    sh '''
                        gcloud auth activate-service-account --key-file=${GCP_KEY}
                        gcloud config set project ${GCP_PROJECT}
                    '''
                }
            }
        }
        
        // Stage 4: Deploy to GCP
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    sh '''
                        echo "Uploading to Google Cloud Storage..."
                        gsutil cp ${APP_NAME}.zip gs://${GCS_BUCKET}/builds/${BUILD_NUMBER}/
                        
                        echo "Deploying to Cloud Run..."
                        gcloud builds submit --tag gcr.io/${GCP_PROJECT}/${APP_NAME}
                        gcloud run deploy ${APP_NAME} \
                          --image gcr.io/${GCP_PROJECT}/${APP_NAME} \
                          --platform managed \
                          --region us-central1 \
                          --allow-unauthenticated
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo "Pipeline succeeded! Access your app at:"
            sh '''
                gcloud run services describe ${APP_NAME} \
                  --platform managed \
                  --region us-central1 \
                  --format="value(status.url)"
            '''
        }
        failure {
            echo "Pipeline failed! Check logs above."
            emailext (
                subject: "FAILED: ${APP_NAME} Build #${BUILD_NUMBER}",
                body: "Check console at ${BUILD_URL}",
                to: 'your-email@example.com'
            )
        }
        always {
            sh 'rm -f ${APP_NAME}.zip || true'
        }
    }
}
