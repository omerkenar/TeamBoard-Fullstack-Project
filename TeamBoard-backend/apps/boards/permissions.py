from rest_framework import permissions

from api.exceptions import BusinessLogicException

from .models import Project, Task, Team


class IsTeamMember(permissions.BasePermission):

    #Objeye erişen kullanıcı takım üyesi mi?
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Team):
            team = obj
        elif isinstance(obj, Project):
            team = obj.team
        elif isinstance(obj, Task):
            team = obj.project.team
        else:
            return False
        
        user = request.user
        is_member = user == team.owner or team.members.filter(id=user.id).exists()

        if not is_member:

            raise BusinessLogicException(
                detail='Bu içeriğe erişmek için ilgili takımın üyesi olmanız gerekiyor.',
                status_code=403,
            )
        return True

class IsTeamOwner(permissions.BasePermission):

    def has_permission(self, request, view):

        # Sadece create için özel kontrol yapıyoruz
        if getattr(view, "action", None) == "create" and request.method == "POST":
            team_id = request.data.get("team")

            if not team_id:
                raise BusinessLogicException(
                    detail="Proje oluşturmak için takım bilgisi zorunludur."
                )

            try:
                team = Team.objects.get(pk=team_id)
            except Team.DoesNotExist:
                raise BusinessLogicException(
                    detail="Böyle bir takım bulunamadı.",
                    status_code=404,
                )

            if request.user != team.owner:
                raise BusinessLogicException(
                    detail="Bu takım için proje oluşturma yetkiniz yok.",
                    status_code=403,
                )

        # Diğer action'lar için object-level kontrol devreye girecek
        return True    

    #Sadece takım sahibi (owner) için izin.
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Team):
            team = obj
        elif isinstance(obj, Project):
            team = obj.team
        elif isinstance(obj, Task):
            team = obj.project.team
        else:
            return False
        
        if request.user != team.owner:
            # Tek tip bir owner hatası
            raise BusinessLogicException(
                detail="Bu işlem için sadece takım sahibi yetkilidir.",
                status_code=403,
            )

        return True
    
class TaskEditPermission(permissions.BasePermission):

    def has_permission(self, request, view):
        # Sadece create için ekstra kontrol
        if getattr(view, "action", None) == "create" and request.method == "POST":
            project_id = request.data.get("project")

            if not project_id:
                raise BusinessLogicException(
                    detail="Görev oluşturmak için proje bilgisi zorunludur."
                )

            try:
                project = Project.objects.select_related("team__owner").get(
                    pk=project_id
                )
            except Project.DoesNotExist:
                raise BusinessLogicException(
                    detail="Böyle bir proje bulunamadı.", status_code=404
                )

            # Sadece takım sahibi görev oluşturabilir
            if request.user != project.team.owner:
                raise BusinessLogicException(
                    detail="Bu projeye görev eklemek için yetkiniz yok.",
                    status_code=403,
                )

        # Diğer action'larda object-level permission'a bırak
        return True    

    #Görev üzerinde düzenleme yapma izni.
    def has_object_permission(self, request, view, obj: Task):
        
        user = request.user
        team_owner = obj.project.team.owner

        # Okuma serbest (Team member şartı view tarafında)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Düzenleme sadece takım sahibi için
        if user == team_owner:
            return True
        
        # Atanan kişinin kendi görevini güncellemesi için izin
        if obj.assignee == user:
            if set(request.data.keys()) == {"status"}:
                return True
            else:
                raise BusinessLogicException(
                    detail="Göreve atanmış olsan bile sadece durum (status) alanını güncelleyebilirsin.",
                    status_code=403,
                )

        # Buraya düşen herkes için özel hata:
        raise BusinessLogicException(
            detail="Bu projeye görev eklemek veya düzenlemek için yetkiniz yok.",
            status_code=403,
        )
               
               
