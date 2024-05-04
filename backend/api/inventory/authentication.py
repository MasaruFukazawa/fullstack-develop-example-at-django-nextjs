from rest_framework_simplejwt.authentication import JWTAuthentication


class CustomJWTAuthentication(JWTAuthentication):
    def get_header(self, request):

        token = request.COOKIES.get('access')

        request.META['HTTP_AUTHORIZATION'] = '{header_type} {access_token}'.format(
            header_type="Bearer",
            access_token=token
        )

        request.META['HTTP_REFRESH_TOKEN'] = request.COOKIES.get('refresh')

        return super().get_header(request)