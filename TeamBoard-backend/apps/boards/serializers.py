from django.contrib.auth.models import User
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Project, Task, Team


class TeamSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'members', 'member_ids', 'created_at']
        read_only_fields = ['id', 'owner', 'members', 'created_at']

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        team = Team.objects.create(owner=self.context['request'].user, **validated_data)

        if member_ids:
            team.members.set(member_ids)

        team.members.add(team.owner)
        return team
    
    def update(self, instance, validated_data):
        member_ids = validated_data.pop('member_ids', None)

        instance = super().update(instance, validated_data)

        if member_ids is not None:
            instance.members.set(member_ids)
            instance.members.add(instance.owner)
        return instance
    
class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'team', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class TaskSerializer(serializers.ModelSerializer):
    assignee_detail = UserSerializer(source='assignee', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 
            'title', 
            'description', 
            'project', 
            'assignee', 
            'assignee_detail', 
            'status', 
            'due_date', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

        
        