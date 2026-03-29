# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Period Comparison Report" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#show" do
    path "/api/v1/reports/period_comparison" do
      get "returns period-over-period coin comparison for hosts" do
        tags "Reports"
        produces "application/json"

        parameter name: :period_a_start, in: :query, type: :string, required: true
        parameter name: :period_a_end,   in: :query, type: :string, required: true
        parameter name: :period_b_start, in: :query, type: :string, required: true
        parameter name: :period_b_end,   in: :query, type: :string, required: true
        parameter name: :scope,          in: :query, type: :string, required: false
        parameter name: :scope_id,       in: :query, type: :integer, required: false

        response(200, "returns comparison for all hosts as admin") do
          let(:period_a_start) { "2026-01-01" }
          let(:period_a_end)   { "2026-01-31" }
          let(:period_b_start) { "2026-02-01" }
          let(:period_b_end)   { "2026-02-28" }

          before do
            session_a = create(:session, date: "2026-01-15", team: team)
            session_b = create(:session, date: "2026-02-15", team: team, session_slot: :slot_two)
            session_a.session_hosts.create!(user: host1)
            session_b.session_hosts.create!(user: host1)
            create(:coin_entry, user: host1, session: session_a, coins: 100)
            create(:coin_entry, user: host1, session: session_b, coins: 150)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            row = json_response[:data].find { |r| r[:entity_id] == host1.id }
            expect(row[:period_a_total]).to eq(100)
            expect(row[:period_b_total]).to eq(150)
            expect(row[:delta]).to eq(50)
            expect(row[:delta_pct]).to eq(50.0)
          end
        end

        response(200, "returns only the specified host when scoped to a single host") do
          let(:period_a_start) { "2026-01-01" }
          let(:period_a_end)   { "2026-01-31" }
          let(:period_b_start) { "2026-02-01" }
          let(:period_b_end)   { "2026-02-28" }
          let(:scope)    { "host" }
          let(:scope_id) { host2.id }

          before do
            session_a = create(:session, date: "2026-01-10", team: team)
            session_a.session_hosts.create!(user: host2)
            create(:coin_entry, user: host2, session: session_a, coins: 80)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:entity_id]).to eq(host2.id)
          end
        end

        response(200, "returns only team hosts when scoped to a team") do
          let(:period_a_start) { "2026-01-01" }
          let(:period_a_end)   { "2026-01-31" }
          let(:period_b_start) { "2026-02-01" }
          let(:period_b_end)   { "2026-02-28" }
          let(:scope)    { "team" }
          let(:scope_id) { team.id }

          before do
            create(:team_membership, team: team, user: host1)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            ids = json_response[:data].map { |r| r[:entity_id] }
            expect(ids).to include(host1.id)
          end
        end

        response(200, "returns zero totals and nil delta_pct when no entries exist") do
          let(:period_a_start) { "2026-01-01" }
          let(:period_a_end)   { "2026-01-31" }
          let(:period_b_start) { "2026-02-01" }
          let(:period_b_end)   { "2026-02-28" }

          before do
            host1
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            row = json_response[:data].find { |r| r[:entity_id] == host1.id }
            expect(row[:period_a_total]).to eq(0)
            expect(row[:period_b_total]).to eq(0)
            expect(row[:delta]).to eq(0)
            expect(row[:delta_pct]).to be_nil
          end
        end

        response(403, "forbids non-admin roles") do
          let(:period_a_start) { "2026-01-01" }
          let(:period_a_end)   { "2026-01-31" }
          let(:period_b_start) { "2026-02-01" }
          let(:period_b_end)   { "2026-02-28" }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status(:forbidden)
          end
        end

        response(422, "returns error when date params are missing") do
          let(:period_a_start) { nil }
          let(:period_a_end)   { nil }
          let(:period_b_start) { nil }
          let(:period_b_end)   { nil }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:unprocessable_content)
          end
        end
      end
    end
  end
end
