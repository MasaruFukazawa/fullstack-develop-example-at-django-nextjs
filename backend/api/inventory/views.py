from django.conf import settings
from django.db.models import F, Value, Sum
from django.db.models.functions import Coalesce
from django.shortcuts import render

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer

import pandas

from api.inventory.authentication import CustomJWTAuthentication
from api.inventory.exception import BusinessException
from .models import Product, Purchase, Sales, SalesFile, Status
from .serializers import (
    InventorySerializer,
    ProductSerializer,
    PurchaseSerializer,
    SalesSerializer,
    FileSerializer
)


# Create your views here.
class ProductView(APIView):
    """ 商品管理
    """

    # 認証クラスの指定
    authentication_classes = [CustomJWTAuthentication]

    # アクセス許可の指定
    # .. 認証済みのリクエストのみ許可
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """
        """
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound

    def get(self, request, id=None, format=None):
        """ 商品を取得する
        """
        if id is None:
            queryset = Product.objects.all()
            serializer = ProductSerializer(queryset, many=True)
        else:
            product = self.get_object(id)
            serializer = ProductSerializer(product)

        return Response(serializer.data, status.HTTP_200_OK)
    
    def post(self, request, format=None):
        """ 商品を登録する
        """
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status.HTTP_201_CREATED)

    def put(self, request, id, format=None):
        """ 商品を更新する
        """
        product = self.get_object(id)
        serializer = ProductSerializer(instance=product, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status.HTTP_200_OK)

    def delete(self, request, id, format=None):
        """ 商品を削除する
        """
        product = self.get_object(id)
        product.delete()
        return Response(status = status.HTTP_200_OK)


class ProductModelViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class PurchaseView(APIView):
    """ 仕入情報管理
    """
    def get(self, request, format=None):
        """ 仕入情報の一覧を取得する
        """
        queryset = Purchase.objects.all()
        serializer = PurchaseSerializer(queryset, many=True)

        return Response(serializer.data, status.HTTP_200_OK)

    def post(self, request, format=None):
        """ 仕入情報を登録する
        """
        serializer = PurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status.HTTP_201_CREATED)


class SalesView(APIView):
    """ 売上情報管理
    """
    def get(self, request, format=None):
        """ 売上情報の一覧を取得する
        """
        queryset = Sales.objects.all()
        serializer = SalesSerializer(queryset, many=True)

        return Response(serializer.data, status.HTTP_200_OK)

    def post(self, request, format=None):
        """ 売上情報を登録する
        """
        serializer = SalesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 在庫が売る分の数量を超えないかチェック
        # .. 在庫テーブルのレコードを取得
        purchase = Purchase.\
            objects.\
            filter(product_id=request.data['product']).\
            aggregate(quantity_sum=Coalesce(Sum('quantity'), 0))

        # .. 売上テーブルのレコードを取得        
        sales = Sales.\
            objects.\
            filter(product_id=request.data['product']).\
            aggregate(quantity_sum=Coalesce(Sum('quantity'), 0))

        if purchase['quantity_sum'] < (sales['quantity_sum'] + int(request.data['quantity'])):
            raise BusinessException('在庫数量を超過することはできません')

        serializer.save()

        return Response(serializer.data, status.HTTP_201_CREATED)


class InventoryView(APIView):
    """ 仕入れ・売上情報API
    """
    def get(self, request, id=None, format=None):
        if id is None:
            return Response({}, status.HTTP_400_BAD_REQUEST)
        else:
            purchase = Purchase.objects.\
                filter(product_id=id).\
                prefetch_related('product').\
                values(
                    'id',
                    'quantity',
                    type=Value('1'),
                    date=F('purchase_date'),
                    unit=F('product__price')
                )

            sales = Sales.objects.\
                filter(product_id=id).\
                prefetch_related('product').\
                values(
                    'id',
                    'quantity',
                    type=Value('2'),
                    date=F('sales_date'),
                    unit=F('product__price')
                )
            
            queryset = purchase.union(sales).order_by(F('date'))
            serializer = InventorySerializer(queryset, many=True)

        return Response(serializer.data, status.HTTP_200_OK)


class LoginView(APIView):
    """ ユーザログイン処理
    args:
        APIView (class): rest_framework.viewsのAPIViewを受け取る
    """
    # 認証クラスの指定
    # .. リクエストヘッダーにtokenを差し込むといったカスタム動作をしないので素の認証クラスを使用する
    authentication_classes = [JWTAuthentication]

    # アクセス許可の指定
    permission_classes = []

    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data.get("access", None)
        refresh = serializer.validated_data.get("refresh", None)

        if access:
            response = Response(status=status.HTTP_200_OK)
            max_age = settings.COOKIE_TIME
            response.set_cookie('access', access, httponly=True, max_age=max_age)
            response.set_cookie('refresh', refresh, httponly=True, max_age=max_age)
            return response

        return Response({'errMsg': 'ユーザーの認証に失敗しました'}, status=status.HTTP_401_UNAUTHORIZED)
    

class RetryView(APIView):
    """ ログインリフレッシュ処理
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = []

    def post(self, request):
        #request.data['refresh'] = request.META.get('HTTP_REFRESH_TOKEN')
        request.data['refresh'] = request.COOKIES.get('refresh')
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data.get("access", None)
        refresh = serializer.validated_data.get("refresh", None)

        if access:
            response = Response(status=status.HTTP_200_OK)
            max_age = settings.COOKIE_TIME
            response.set_cookie('access', access, httponly=True, max_age=max_age)
            response.set_cookie('refresh', refresh, httponly=True, max_age=max_age)
            return response
        
        return Response({'errMsg': 'ユーザーの認証に失敗しました'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    """ ログアウト処理
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args):
        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response


class SalesAsyncView(APIView):
    pass


class SalesSyncView(APIView):
    """
    """
    # 認証クラスの指定
    #authentication_classes = [CustomJWTAuthentication]

    # アクセス許可の指定
    # .. 認証済みのリクエストのみ許可
    #permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = FileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        filename = serializer.validated_data['file'].name

        with open(filename, 'wb') as f:
            f.write(serializer.validated_data['file'].read())

        sales_file = SalesFile(file_name=filename, status=Status.SYNC)
        sales_file.save()

        df = pandas.read_csv(filename)

        for _, row in df.iterrows():
            sales = Sales(  
                product_id=row['product'],
                sales_date=row['date'],
                quantity=row['quantity'],
                import_file=sales_file
            )
            sales.save()

        return Response(status=201)


class SalesList(APIView):
    pass