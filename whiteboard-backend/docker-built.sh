# VERSION=prod-$(cat package.json | jq '.version' | sed -e "s|\"||g")
VERSION=prod-0.1.9

echo "${VERSION}"

aws ecr get-login-password --region ap-south-1 --profile ecr-manager | docker login --username AWS --password-stdin 533352480343.dkr.ecr.ap-south-1.amazonaws.com

# docker build -t whiteboard-backend:"${VERSION}" .

# For mac M1 or M2
docker buildx build --platform=linux/amd64 -t whiteboard-backend:"${VERSION}" .

docker tag whiteboard-backend:"${VERSION}" 533352480343.dkr.ecr.ap-south-1.amazonaws.com/whiteboard-backend:"${VERSION}"

docker push 533352480343.dkr.ecr.ap-south-1.amazonaws.com/whiteboard-backend:"${VERSION}"
