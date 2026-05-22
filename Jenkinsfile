pipeline {
    agent any
    
    environment {
        DOCKER_CREDENTIALS_ID = 'dockerhub-creds'
        DOCKER_HUB_USERNAME = 'rohitbansal2113'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/healthcare-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/healthcare-frontend"
        TAG = "${env.BUILD_ID}"
        KUBECONFIG_CREDENTIALS_ID = 'kubeconfig'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
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
                    # Set up Python library dependencies for Ansible k8s module
                    if python3 -m venv venv; then
                        echo "Using virtual environment for python dependencies..."
                        venv/bin/pip install --upgrade pip
                        venv/bin/pip install kubernetes
                        PYTHON_INTERP="$(pwd)/venv/bin/python"
                    else
                        echo "python3-venv not available. Falling back to system pip install..."
                        pip3 install --user kubernetes --break-system-packages || pip install --user kubernetes || true
                        PYTHON_INTERP="python3"
                    fi

                    # Run the Ansible playbook using the setup Python interpreter
                    ansible-playbook -i ansible/inventory.ini ansible/playbook.yml \
                      -e "ansible_python_interpreter=${PYTHON_INTERP}" \
                      --extra-vars "namespace=healthcare-ns backend_image=${BACKEND_IMAGE}:${TAG} frontend_image=${FRONTEND_IMAGE}:${TAG}"
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
            mail to: 'your-email@example.com',
                 subject: "SUCCESS: Jenkins Pipeline ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                 body: "Great news! Your deployment to Kubernetes was successful.\n\nBuild URL: ${env.BUILD_URL}"
        }
        failure {
            echo "Pipeline failed! Please check the logs."
            mail to: 'your-email@example.com',
                 subject: "FAILURE: Jenkins Pipeline ${env.JOB_NAME} [${env.BUILD_NUMBER}]",
                 body: "Unfortunately, the pipeline failed. Please check the logs here: ${env.BUILD_URL}"
        }
    }
}
