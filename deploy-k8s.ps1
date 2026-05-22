$ErrorActionPreference = "Stop"

Write-Host "Checking Docker status..." -ForegroundColor Cyan
try {
    docker info > $null
    Write-Host "Docker is running." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker Desktop is not fully running yet. Please wait until the Docker icon is green in your system tray and try again." -ForegroundColor Red
    exit 1
}

$BACKEND_IMAGE = "rohitbansal2113/healthcare-backend:latest"
$FRONTEND_IMAGE = "rohitbansal2113/healthcare-frontend:latest"

Write-Host "`nBuilding Backend Docker Image..." -ForegroundColor Cyan
docker build -t $BACKEND_IMAGE backend

Write-Host "`nBuilding Frontend Docker Image..." -ForegroundColor Cyan
docker build -t $FRONTEND_IMAGE frontend

Write-Host "`nUpdating Kubernetes deployment files with new image tags..." -ForegroundColor Cyan
# Replace the image placeholders in the deployment files
(Get-Content k8s/backend-deployment.yaml) -replace '__BACKEND_IMAGE__', $BACKEND_IMAGE | Set-Content k8s/backend-deployment.yaml
(Get-Content k8s/frontend-deployment.yaml) -replace '__FRONTEND_IMAGE__', $FRONTEND_IMAGE | Set-Content k8s/frontend-deployment.yaml

Write-Host "`nApplying Kubernetes manifests..." -ForegroundColor Cyan
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/hpa.yaml

Write-Host "`nDeployment to Kubernetes initiated successfully!" -ForegroundColor Green
Write-Host "You can check the status of your pods by running: kubectl get pods" -ForegroundColor Yellow
