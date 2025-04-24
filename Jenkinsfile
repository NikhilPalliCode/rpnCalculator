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
                // Simple verification that files exist
                sh 'ls -la'
                sh 'test -f index.html || (echo "index.html missing!" && exit 1)'
                echo 'Basic file verification passed'
            }
        }
        
        stage('Run Tests') {
            steps {
                // Add your test commands here if you have any
                // Example for simple HTML validation:
                // sh 'html5validator --root .'
                echo 'Skipping tests (add your test commands when ready)'
            }
        }
        
        stage('Package Artifact') {
            steps {
                // Create a zip file of your application
                sh 'zip -r rpn-calculator.zip * -x "*.git*"'
                archiveArtifacts artifacts: 'rpn-calculator.zip', fingerprint: true
                echo 'Application packaged successfully'
            }
        }
        
        stage('Deploy (Optional)') {
            steps {
                echo 'Deployment stage would go here'
                echo 'You could deploy to:'
                echo '1. Local directory (for testing)'
                echo '2. GitHub Pages (free hosting)'
                echo '3. Any web server via SSH'
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // Optional: Add notification here
        }
        failure {
            echo 'Pipeline failed!'
            // Optional: Add notification here
        }
    }
}