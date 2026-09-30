from django.urls import path
from . import views


urlpatterns = [

    path(
        '',
        views.registration_list,
        name='registration-list'
    ),

    path(
        'create/',
        views.create_registration,
        name='create-registration'
    ),

    path(
        '<int:pk>/',
        views.registration_detail,
        name='registration-detail'
    ),

    path(
        '<int:pk>/cancel/',
        views.cancel_registration,
        name='cancel-registration'
    ),
]