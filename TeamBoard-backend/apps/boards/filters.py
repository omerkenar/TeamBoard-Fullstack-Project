import django_filters

from .models import Project, Task


class ProjectFilter(django_filters.FilterSet):
    class Meta:
        model = Project
        fields = {
            'team': ['exact'],
            'is_active': ['exact'],
        }

class TaskFilter(django_filters.FilterSet):
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')

    class Meta:
        model = Task
        fields = {
            'project': ['exact'],
            'assignee': ['exact'],
            'status': ['exact'],
        }

      

        