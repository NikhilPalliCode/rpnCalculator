pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'       // Your GCP project ID
        GCS_BUCKET = 'rpn-calculator-builds'    // Your storage bucket
        APP_NAME = 'rpn-calculator'             // Your application name
        CLOUD_RUN_REGION = 'us-central1'        // Deployment region
    }
    
    stages {
        // Stage 1: Checkout Code
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: 'main']],
                    userRemoteConfigs: [[
                        url: 'https://github.com/NikhilPalliCode/rpnCalculator.git',
                        credentialsId: '' // Add if private repo
                    ]],
                    extensions: [
                        [$class: 'CleanCheckout'],
                        [$class: 'RelativeTargetDirectory', relativeTargetDir: 'src']
                    ]
                ])
                dir('src') {
                    sh 'ls -la'  // Verify files
                }
            }
        }
        
        // Stage 2: Build Package
        stage('Build') {
            steps {
                dir('src') {
                    powershell '''
                        # Clean temp directory
                        $tempDir = Join-Path -Path $pwd -ChildPath "_temp"
                        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
                        New-Item -ItemType Directory -Path $tempDir | Out-Null
                        
                        # Copy files (excluding patterns)
                        Get-ChildItem -Exclude @("*.git*", "*.json", "_temp", "*.md", "Jenkinsfile") | 
                            Where-Object { $_.FullName -ne $tempDir } |
                            Copy-Item -Destination $tempDir -Recurse -Force
                        
                        # Create zip
                        Add-Type -Assembly "System.IO.Compression.FileSystem"
                        $zipPath = Join-Path -Path $pwd -ChildPath "rpn-calculator.zip"
                        if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
                        
                        try {
                            [IO.Compression.ZipFile]::CreateFromDirectory(
                                (Resolve-Path $tempDir).Path,
                                (Resolve-Path $zipPath).Path,
                                [IO.Compression.CompressionLevel]::Optimal,
                                $false
                            )
                            Write-Output "Zip created successfully ($([math]::Round((Get-Item $zipPath).Length/1KB)) KB)"
                        } catch {
                            Write-Error "Failed to create zip: $_"
                            exit 1
                        }
                        
                        # Verify
                        if (!(Test-Path $zipPath -PathType Leaf)) {
                            throw "Zip file was not created!"
                        }
                        
                        # Show contents
                        [IO.Compression.ZipFile]::OpenRead($zipPath).Entries | 
                            Select-Object FullName,CompressedLength,Length | Format-Table
                        
                        # Cleanup
                        Remove-Item $tempDir -Recurse -Force
                    '''
                }
            }
        }
        
        // Stage 3: GCP Authentication
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
        
        // Stage 4: Deploy to GCP
        stage('Deploy') {
            steps {
                dir('src') {
                    withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                        bat '''
                            echo "Uploading to Cloud Storage..."
                            gsutil cp rpn-calculator.zip gs://%GCS_BUCKET%/builds/%BUILD_NUMBER%.zip
                            
                            echo "Building container..."
                            gcloud builds submit --tag gcr.io/%GCP_PROJECT%/%APP_NAME%:%BUILD_NUMBER%
                            
                            echo "Deploying to Cloud Run..."
                            gcloud run deploy %APP_NAME% ^
                              --image gcr.io/%GCP_PROJECT%/%APP_NAME%:%BUILD_NUMBER% ^
                              --platform managed ^
                              --region %CLOUD_RUN_REGION% ^
                              --allow-unauthenticated ^
                              --update-env-vars BUILD_NUMBER=%BUILD_NUMBER%
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            script {
                def url = sh(
                    script: 'gcloud run services describe ${APP_NAME} --platform managed --region ${CLOUD_RUN_REGION} --format="value(status.url)"',
                    returnStdout: true
                ).trim()
                echo "✅ Deployment Successful!"
                echo "📌 Application URL: ${url}"
            }
        }
        failure {
            echo "❌ Pipeline Failed!"
            emailext (
                subject: "FAILED: ${APP_NAME} Build #${BUILD_NUMBER}",
                body: """Check console at ${BUILD_URL}
                
                Error: ${currentBuild.currentResult}""",
                to: 'nikhilpalle1997@gmail.com', // Your email
                attachLog: true
            )
        }
        always {
            dir('src') {
                bat 'del rpn-calculator.zip 2>nul || echo "No zip to delete"'
            }
            cleanWs()
        }
    }
}
