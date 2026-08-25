package com.gachi.gacha.server.store.domain;

import static com.gachi.gacha.server.common.util.BaseUtils.valueOrCurrent;

import com.gachi.gacha.server.common.domain.BaseTimeEntity;
import com.gachi.gacha.server.store.domain.exception.InvalidStoreException;
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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoreDetail extends BaseTimeEntity {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    private String businessHours;

    private String paymentMethods;

    private String phone;

    @ElementCollection
    @CollectionTable(
            name = "store_facility",
            joinColumns = @JoinColumn(name = "store_id")
    )
    @Column(name = "facility")
    private List<String> facilities;

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

    @Builder
    private StoreDetail(
            final Long id,
            final Store store,
            final String businessHours,
            final String paymentMethods,
            final String phone,
            final List<String> facilities,
            final String instagramId,
            final Integer machineAmount,
            final Integer kujiAmount,
            final Long coinPrice,
            final Long gachaMinPrice,
            final Long gachaMaxPrice,
            final Long kujiMinPrice,
            final Long kujiMaxPrice,
            final Long selectGachaMinPrice,
            final Long selectGachaMaxPrice,
            final Boolean hasRandomBox,
            final Boolean hasSelectGacha
    ) {
        validateNonNegative(machineAmount, kujiAmount, coinPrice);
        validatePriceRange(gachaMinPrice, gachaMaxPrice);
        validatePriceRange(kujiMinPrice, kujiMaxPrice);
        validatePriceRange(selectGachaMinPrice, selectGachaMaxPrice);

        this.id = id;
        this.store = store;
        this.businessHours = businessHours;
        this.paymentMethods = paymentMethods;
        this.phone = phone;
        this.facilities = facilities == null ? new ArrayList<>() : new ArrayList<>(facilities);
        this.instagramId = instagramId;
        this.machineAmount = machineAmount;
        this.kujiAmount = kujiAmount;
        this.coinPrice = coinPrice;
        this.gachaMinPrice = gachaMinPrice;
        this.gachaMaxPrice = gachaMaxPrice;
        this.kujiMinPrice = kujiMinPrice;
        this.kujiMaxPrice = kujiMaxPrice;
        this.selectGachaMinPrice = selectGachaMinPrice;
        this.selectGachaMaxPrice = selectGachaMaxPrice;
        this.hasRandomBox = hasRandomBox;
        this.hasSelectGacha = hasSelectGacha;
    }

    public StoreDetail patch(final StoreDetailUpdate update) {
        return StoreDetail.builder()
                .id(id)
                .store(store)
                .businessHours(valueOrCurrent(update.businessHours(), businessHours))
                .paymentMethods(valueOrCurrent(update.paymentMethods(), paymentMethods))
                .phone(valueOrCurrent(update.phone(), phone))
                .facilities(update.facilities() == null ? facilities : update.facilities())
                .instagramId(valueOrCurrent(update.instagramId(), instagramId))
                .machineAmount(valueOrCurrent(update.machineAmount(), machineAmount))
                .kujiAmount(valueOrCurrent(update.kujiAmount(), kujiAmount))
                .coinPrice(valueOrCurrent(update.coinPrice(), coinPrice))
                .gachaMinPrice(valueOrCurrent(update.gachaMinPrice(), gachaMinPrice))
                .gachaMaxPrice(valueOrCurrent(update.gachaMaxPrice(), gachaMaxPrice))
                .kujiMinPrice(valueOrCurrent(update.kujiMinPrice(), kujiMinPrice))
                .kujiMaxPrice(valueOrCurrent(update.kujiMaxPrice(), kujiMaxPrice))
                .selectGachaMinPrice(valueOrCurrent(update.selectGachaMinPrice(), selectGachaMinPrice))
                .selectGachaMaxPrice(valueOrCurrent(update.selectGachaMaxPrice(), selectGachaMaxPrice))
                .hasRandomBox(valueOrCurrent(update.hasRandomBox(), hasRandomBox))
                .hasSelectGacha(valueOrCurrent(update.hasSelectGacha(), hasSelectGacha))
                .build();
    }

    private void validateNonNegative(
            final Integer machineAmount,
            final Integer kujiAmount,
            final Long coinPrice
    ) {
        if (isNegative(machineAmount) || isNegative(kujiAmount) || isNegative(coinPrice)) {
            throw new InvalidStoreException();
        }
    }

    private void validatePriceRange(final Long minPrice, final Long maxPrice) {
        if (isNegative(minPrice) || isNegative(maxPrice)) {
            throw new InvalidStoreException();
        }
        if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
            throw new InvalidStoreException();
        }
    }

    private boolean isNegative(final Number value) {
        return value != null && value.longValue() < 0;
    }
}
