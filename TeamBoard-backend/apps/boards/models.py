from django.contrib.auth.models import User
from django.db import models

# Burada “proje sahibi”ni team.owner olarak kabul ediyoruz.
# Yani takımı kuran kullanıcı, takım altındaki tüm projelerin ve görevlerin sahibi gibi davranacak.

class Team(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        User, related_name='owned_teams', on_delete=models.CASCADE
    )
    members = models.ManyToManyField(
        User, related_name='teams', blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
    

class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    team = models.ForeignKey(
        Team, related_name='projects', on_delete=models.CASCADE
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    

class Task(models.Model):
    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'

    STATUS_CHOICES = [
        (STATUS_TODO, 'To Do'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_DONE, 'Done'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    project = models.ForeignKey(
        Project, related_name='tasks', on_delete=models.CASCADE
    )
    assignee = models.ForeignKey(
        User, related_name='tasks', on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO
    )   
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
