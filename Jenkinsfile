pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
        // Updated to use the system-wide gcloud command
        GCLOUD_PATH = 'gcloud'
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/NikhilPalliCode/rpnCalculator.git'
                    ]]
                ])
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
                    $tempDir = "$env:WORKSPACE\\temp"
                    if (Test-Path $tempDir) { 
                        Remove-Item $tempDir -Recurse -Force 
                    }
                    
                    # Create new temp directory
                    New-Item -ItemType Directory -Path $tempDir | Out-Null
                    
                    # Copy files excluding patterns
                    Get-ChildItem -Exclude "*.git*", "temp", "Jenkinsfile" | 
                        Where-Object { $_.FullName -ne $tempDir } |
                        Copy-Item -Destination $tempDir -Recurse -Force
                    
                    # Create zip archive
                    $zipPath = "$env:WORKSPACE\\rpn-calculator.zip"
                    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
                    
                    Add-Type -Assembly "System.IO.Compression.FileSystem"
                    [IO.Compression.ZipFile]::CreateFromDirectory(
                        $tempDir,
                        $zipPath,
                        [IO.Compression.CompressionLevel]::Optimal,
                        $false
                    )
                    
                    # Verify zip was created
                    if (!(Test-Path $zipPath)) { 
                        throw "Failed to create zip file" 
                    }
                    
                    # Cleanup
                    Remove-Item $tempDir -Recurse -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
        
        stage('Verify GCloud') {
            steps {
                script {
                    // First check if gcloud is in PATH
                    def gcloudExists = bat(
                        script: 'where gcloud',
                        returnStatus: true
                    ) == 0
                    
                    if (!gcloudExists) {
                        error("gcloud not found in PATH. Please install Google Cloud SDK.")
                    }
                    
                    // Test basic gcloud command
                    def gcloudWorks = bat(
                        script: 'gcloud --version',
                        returnStatus: true
                    ) == 0
                    
                    if (!gcloudWorks) {
                        error("gcloud command failed. Check installation.")
                    }
                }
            }
        }
        
        stage('Authenticate') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gcloud auth activate-service-account --key-file="%GCP_KEY%"
                        gcloud config set project %GCP_PROJECT%
                        gcloud auth list
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gcloud builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%
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
            // Removed email to avoid SMTP issues
        }
    }
}
