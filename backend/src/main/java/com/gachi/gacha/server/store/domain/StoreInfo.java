package com.gachi.gacha.server.store.domain;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreInfo extends BaseTimeEntity {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String businessHours;

    @Builder.Default
    @ElementCollection
    @CollectionTable(
            name = "store_payment_method",
            joinColumns = @JoinColumn(name = "store_id")
    )
    @Column(name = "payment_method")
    private List<String> paymentMethods = new ArrayList<>();

    private String phone;

    @Builder.Default
    @ElementCollection
    @CollectionTable(
            name = "store_facility",
            joinColumns = @JoinColumn(name = "store_id")
    )
    @Column(name = "facility")
    private List<String> facilities = new ArrayList<>();

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

    protected void assignStore(Store store) {
        this.store = store;
    }
}
