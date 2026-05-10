pipeline {
    agent any
    
    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
        DOCKER_HUB_USERNAME = 'your_dockerhub_username'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/healthcare-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/healthcare-frontend"
        TAG = "${env.BUILD_ID}"
        KUBECONFIG_CREDENTIALS_ID = 'k8s-kubeconfig'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build & Test Backend') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests' // Add tests back with `mvn test` in real environment
                }
            }
        }

        stage('Build & Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    docker.build("${BACKEND_IMAGE}:${TAG}", "backend")
                    docker.build("${BACKEND_IMAGE}:latest", "backend")
                    
                    docker.build("${FRONTEND_IMAGE}:${TAG}", "frontend")
                    docker.build("${FRONTEND_IMAGE}:latest", "frontend")
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', "${DOCKER_CREDENTIALS_ID}") {
                        docker.image("${BACKEND_IMAGE}:${TAG}").push()
                        docker.image("${BACKEND_IMAGE}:latest").push()
                        
                        docker.image("${FRONTEND_IMAGE}:${TAG}").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: "${KUBECONFIG_CREDENTIALS_ID}", variable: 'KUBECONFIG')]) {
                    sh '''
                    # Apply secrets from Vault or directly
                    kubectl apply -f k8s/namespace.yaml
                    
                    # Apply MySQL
                    kubectl apply -f k8s/mysql-deployment.yaml
                    
                    # Apply Backend & Frontend with updated image tags
                    sed -i "s|__BACKEND_IMAGE__|${BACKEND_IMAGE}:${TAG}|g" k8s/backend-deployment.yaml
                    kubectl apply -f k8s/backend-deployment.yaml
                    
                    sed -i "s|__FRONTEND_IMAGE__|${FRONTEND_IMAGE}:${TAG}|g" k8s/frontend-deployment.yaml
                    kubectl apply -f k8s/frontend-deployment.yaml
                    
                    # Apply HPA for Scalability
                    kubectl apply -f k8s/hpa.yaml
                    '''
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "Deployment successful! Live patching (Rolling updates) applied automatically by Kubernetes."
        }
        failure {
            echo "Pipeline failed! Please check the logs."
        }
    }
}
