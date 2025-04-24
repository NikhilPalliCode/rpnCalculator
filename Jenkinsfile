pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
        CLOUD_RUN_REGION = 'us-central1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    // Try PowerShell first
                    try {
                        powershell '''
                            # Create temp directory
                            $tempDir = "$env:WORKSPACE\\_temp"
                            if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
                            New-Item -ItemType Directory -Path $tempDir | Out-Null
                            
                            # Copy files with exclusions
                            Get-ChildItem -Exclude "*.git*", "*.json", "_temp", "*.md", "Jenkinsfile" | 
                                Copy-Item -Destination $tempDir -Recurse -Force
                            
                            # Create zip using absolute paths
                            $zipPath = "$env:WORKSPACE\\rpn-calculator.zip"
                            if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
                            
                            Add-Type -Assembly "System.IO.Compression.FileSystem"
                            [IO.Compression.ZipFile]::CreateFromDirectory(
                                "$tempDir",
                                "$zipPath",
                                [IO.Compression.CompressionLevel]::Optimal,
                                $false
                            )
                            
                            # Verify
                            if (!(Test-Path $zipPath)) { throw "Zip creation failed" }
                            Write-Host "Zip created successfully at $zipPath"
                            
                            # Cleanup
                            Remove-Item $tempDir -Recurse -Force
                        '''
                    } catch (Exception e) {
                        echo "PowerShell zip failed, trying 7-Zip fallback"
                        // Fallback to 7-Zip if available
                        bat '''
                            where 7z > nul 2>&1
                            if %ERRORLEVEL% equ 0 (
                                7z a -r rpn-calculator.zip * -xr!*.git* -xr!*.json -xr!*.md -xr!Jenkinsfile
                            ) else (
                                echo "Neither PowerShell zip nor 7-Zip available"
                                exit 1
                            )
                        '''
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
                rmdir /s /q _temp 2>nul || echo "No temp dir to delete"
            '''
        }
        success {
            script {
                def url = bat(
                    script: 'gcloud run services describe %APP_NAME% --platform managed --region %CLOUD_RUN_REGION% --format="value(status.url)"',
                    returnStdout: true
                ).trim()
                echo "Deployment successful! Access your app at: ${url}"
            }
        }
        failure {
            emailext (
                subject: "FAILED: ${env.JOB_NAME} Build #${env.BUILD_NUMBER}",
                body: "Check console at ${env.BUILD_URL}",
                to: 'nikhilpalle1997@gmail.com',
                attachLog: true
            )
        }
    }
}
