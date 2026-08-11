package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class StoreInfo extends BaseTimeEntity {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    private Store store;

    private String name;
    private String address;
    private String businessHours;
    private String paymentMethod;
    private String phone;
    private String facilities;
    private String instagramId;

    private Integer machineAmount;
    private Integer kujiAmount;

    private Long coinPrice;
    private Long gachaMinPrice;
    private Long gachaMaxPrice;
    private Long kujiMinPrice;
    private Long kujiMaxPrice;
    private Long selectGachaMinPrice;
    private Long selectGachaMaxPrice;

    private Boolean hasRandomBox;
    private Boolean hasSelectGacha;
}
