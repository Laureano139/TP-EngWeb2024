<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="xs"
    version="2.0">
    
    <xsl:output method="xml" indent="yes"/>
    
    <xsl:template match="mapa">
        <xsl:result-document href="datas.xml">
            <datas>
                <xsl:for-each select="document(rua/@doc)">
                    <xsl:apply-templates mode="datas"/>
                </xsl:for-each>
            </datas>
        </xsl:result-document>
    </xsl:template>
    
    <xsl:template mode="datas" match="data">
        <xsl:copy-of select="."/>
    </xsl:template>
    
    <xsl:template match="data" mode="datas">
        <data>
            <nome><xsl:value-of select="."/></nome>
            <rua><xsl:value-of select="/rua/meta/número"/></rua>
            <posição><xsl:value-of select="generate-id()"/></posição>
        </data>
    </xsl:template>
    
    <!-- garbage colector -->
    <xsl:template mode="datas" match="text()" priority="-1"/>  
    
</xsl:stylesheet>