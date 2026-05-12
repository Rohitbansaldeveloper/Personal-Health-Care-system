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

        stage('Build Docker Images') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${TAG} -t ${BACKEND_IMAGE}:latest backend"
                sh "docker build -t ${FRONTEND_IMAGE}:${TAG} -t ${FRONTEND_IMAGE}:latest frontend"
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh "echo \\$DOCKER_PASSWORD | docker login -u \\$DOCKER_USERNAME --password-stdin"
                    sh "docker push ${BACKEND_IMAGE}:${TAG}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    sh "docker push ${FRONTEND_IMAGE}:${TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
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
