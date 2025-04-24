pipeline {
    agent any
    
    environment {
        GCP_PROJECT = 'rpn-calculator-ci'
        GCS_BUCKET = 'rpn-calculator-builds'
        APP_NAME = 'rpn-calculator'
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
                    $tempDir = Join-Path $pwd "_temp"
                    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
                    New-Item -ItemType Directory -Path $tempDir | Out-Null
                    
                    Get-ChildItem -Exclude @("*.git*", "*.json", "_temp", "*.md") | 
                        Copy-Item -Destination $tempDir -Recurse -Force
                    
                    Add-Type -Assembly "System.IO.Compression.FileSystem"
                    [IO.Compression.ZipFile]::CreateFromDirectory(
                        $tempDir, 
                        "$pwd\rpn-calculator.zip",
                        [IO.Compression.CompressionLevel]::Optimal,
                        $false
                    )
                    
                    Remove-Item $tempDir -Recurse -Force
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY')]) {
                    bat '''
                        gcloud auth activate-service-account --key-file="%GCP_KEY%"
                        gcloud config set project %GCP_PROJECT%
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
