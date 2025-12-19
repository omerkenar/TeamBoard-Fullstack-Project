import logging

from django.db.models import Q
from django.shortcuts import render
from rest_framework import permissions, status, viewsets

from api.exceptions import BusinessLogicException

from .filters import ProjectFilter, TaskFilter
from .models import Project, Task, Team
from .permissions import IsTeamMember, IsTeamOwner, TaskEditPermission
from .serializers import ProjectSerializer, TaskSerializer, TeamSerializer

logger = logging.getLogger(__name__)
# Create your views here.

class TeamViewSet(viewsets.ModelViewSet):

    serializer_class = TeamSerializer

    # Kullanıcı sadece üyesi veya owner olduğu takımları görebilir
    def get_queryset(self):
        user = self.request.user
        return Team.objects.filter(Q(owner=user) | Q(members=user)).distinct()
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTeamOwner()]
        return [permissions.IsAuthenticated(), IsTeamMember()]
    
class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filterset_class = ProjectFilter

    # Kullanıcı sadece üyesi olduğu takımların projelerini görebilir
    def get_queryset(self):
     user = self.request.user
     return Project.objects.filter(
        Q(team__owner=user) | Q(team__members=user)
    ).distinct()
    
    # Sadece team owner proje oluşturup düzenleyebilsin
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsTeamOwner()]
        return [permissions.IsAuthenticated(), IsTeamMember()]

    def perform_create(self, serializer):

        team = serializer.validated_data["team"]
        user = self.request.user

        if team.projects.count() >= 10:
            # 400 dönen business rule
            raise BusinessLogicException(
                detail="Bu takım için maksimum proje sayısına ulaşıldı."
            )

        project = serializer.save()
        logger.info(
            "User %s created project %s (id=%s) in team %s",
            user.username,
            project.title,
            project.id,
            team.name,)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filterset_class = TaskFilter

    # Kullanıcı owner’ı veya üyesi olduğu takımların görevlerini görebilir
    def get_queryset(self):
        user = self.request.user
        return Task.objects.filter(
            Q(project__team__owner=user) | Q(project__team__members=user)
        ).distinct()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), TaskEditPermission(), IsTeamMember()]
        return [permissions.IsAuthenticated(), IsTeamMember()]
    
    
    def perform_update(self, serializer):

        before = self.get_object()
        task = serializer.save()
        user = self.request.user
      
        logger.info(
            "User %s updated task %s (id=%s) - old_status=%s, new_status=%s",
            user.username,
            task.title,
            task.id,
            before.status,
            task.status,
        )