from rest_framework import serializers

from .models import Product, Purchase, Sales


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class PurchaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purchase
        fields = '__all__'


class SalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sales
        fields = '__all__'

class InventorySerializer(serializers.Serializer):
    """ 仕入れ・売上情報のためのシリアライザ
    """
    # API で返すフィールドを定義
    # .. 仕入れ・売上 モデルをUNION結合するので、よしなに
    id = serializers.IntegerField()
    unit = serializers.IntegerField()
    quantity = serializers.IntegerField()
    type = serializers.IntegerField()
    date = serializers.DateTimeField()
