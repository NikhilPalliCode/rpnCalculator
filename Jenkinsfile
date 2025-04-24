pipeline {
    agent any
    
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
                    New-Item -ItemType Directory -Path temp
                    Copy-Item * -Destination temp -Exclude "*.git*"
                    Compress-Archive -Path temp/* -DestinationPath rpn-calculator.zip
                    Remove-Item temp -Recurse -Force
                '''
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
